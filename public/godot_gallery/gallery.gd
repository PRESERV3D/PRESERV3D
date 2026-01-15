extends Node3D

@onready var model_http: HTTPRequest = $ModelDownload

# Multiple HTTP request nodes for parallel downloads
@onready var http_pool: Array[HTTPRequest] = []
var max_concurrent_downloads := 3

# Cache system
var cache_db: Dictionary = {}
var cache_file_path := "user://model_cache.dat"
var cache_expiry_hours := 24

# Model loading states
enum ModelState { NONE, DOWNLOADING, CACHED, LOADING, LOADED, ERROR }
var model_states: Array[ModelState] = []
var model_cache_keys: Array[String] = []

# Progressive loading
var high_priority_models: Array[int] = [0, 1]  # Load first 2 models immediately
var background_loading := false

# Performance settings
var models_per_frame := 1  # Limit GLTF processing per frame
var pending_gltf_queue: Array = []

# Updated pedestal references to match your scene structure
@onready var pedestals: Array = []

# Log display components - created dynamically
var compact_label: Label
var expanded_label: Label
var log_container: Control
var log_background: Panel
var expand_button: Button

# Interaction system components
var camera: Camera3D
var interaction_ui: Control
var interaction_label: Label
var popup_container: Control
var popup_background: Panel
var popup_title: Label
var popup_description: Label
var popup_close_button: Button

var passed_model_urls: Array = []
var model_urls: Array = []
var model_info: Array = []  # Store model information
var current_download_index := 0
var initialization_complete := false

# Default URLs for testing when no URLs are provided
var default_test_urls: Array = [
	"https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/artifacts//PUP%20Trophy.glb",
	"https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/artifacts//oiiaioooooiai_cat.glb"
]

# Track imported scenes for rotation and interaction
var imported_scenes: Array[Node3D] = []
var pedestal_models: Dictionary = {}  # Maps pedestal to its model scene
var highlighted_models: Dictionary = {}  # Maps model to highlight state
var rotation_speed := 0.3  # Radians per second

# Interaction system
var currently_highlighted: Node3D = null
var interaction_range := 8.0
var raycast_length := 15.0
var highlight_scale_multiplier := 1.1

# Loading indicator system
var counter_label: Label
var spinner_label: Label
var loading_container: Control
var loading_background: Panel
var models_loaded := 0
var models_total := 0
var spinner_frames := ["◜", "◝", "◞", "◟"]
var spinner_index := 0
var spinner_timer := 0.0

# Fullscreen
var fullscreen_button: TextureButton
var is_fullscreen := false

func _ready() -> void:
	setup_http_pool()
	load_cache_database()
	setup_fullscreen_toggle()
	setup_loading_indicator()
	setup_interaction_ui()
	setup_popup_ui()
	setup_pedestals()
	find_camera()
	print("Godot scene ready, found %d pedestals" % pedestals.size())
	
	# Check for URLs from JavaScript with multiple attempts
	check_for_urls_with_retry()

func setup_http_pool():
	# Create multiple HTTP request nodes for parallel downloads
	for i in range(max_concurrent_downloads):
		var http = HTTPRequest.new()
		http.name = "HTTPRequest_" + str(i)
		add_child(http)
		# Ensure clean connection and per-node metadata
		if http.request_completed.is_connected(_on_http_request_completed):
			http.request_completed.disconnect(_on_http_request_completed)
		# In Godot 4, bind() appends arguments to the end of signal args
		http.request_completed.connect(_on_http_request_completed.bind(i))
		http.set_meta("busy", false)
		http_pool.append(http)

	print("Created %d HTTP request nodes for parallel downloads" % max_concurrent_downloads)

func load_cache_database():
	if FileAccess.file_exists(cache_file_path):
		var file = FileAccess.open(cache_file_path, FileAccess.READ)
		if file:
			var json_string = file.get_as_text()
			file.close()
			
			var json = JSON.new()
			if json.parse(json_string) == OK:
				cache_db = json.data
				print("Loaded cache database with %d entries" % cache_db.size())
				cleanup_expired_cache()
			else:
				print("Failed to parse cache database")
		else:
			print("Failed to open cache file")
	else:
		print("No cache database found, starting fresh")

func save_cache_database():
	var file = FileAccess.open(cache_file_path, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(cache_db))
		file.close()

func cleanup_expired_cache():
	var current_time = Time.get_unix_time_from_system()
	var expired_keys = []

	for key in cache_db.keys():
		var entry = cache_db[key]
		if entry.has("timestamp"):
			var age_hours = (current_time - entry.timestamp) / 3600.0
			if age_hours > cache_expiry_hours:
				expired_keys.append(key)
				# Remove cached file
				if entry.has("file_path") and FileAccess.file_exists(entry.file_path):
					DirAccess.remove_absolute(entry.file_path)

	for key in expired_keys:
		cache_db.erase(key)

	if expired_keys.size() > 0:
		print("Cleaned up %d expired cache entries" % expired_keys.size())
		save_cache_database()

func generate_cache_key(url: String) -> String:
	# Create a hash-based cache key from URL
	return url.sha256_text().substr(0, 16)

func find_camera():
	# Try to find the camera in the scene
	camera = find_camera_recursive(get_tree().root)
	if camera:
		print("Found camera: %s" % camera.name)
	else:
		print("WARNING: No camera found in scene")

func find_camera_recursive(node: Node) -> Camera3D:
	if node is Camera3D:
		return node
	
	for child in node.get_children():
		var result = find_camera_recursive(child)
		if result:
			return result
	
	return null

func setup_interaction_ui():
	# Create interaction prompt UI
	interaction_ui = Control.new()
	interaction_ui.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	interaction_ui.position = Vector2(-100, -50)
	interaction_ui.size = Vector2(200, 40)
	interaction_ui.visible = false
	
	# Create background for interaction prompt
	var interaction_bg = Panel.new()
	interaction_bg.size = Vector2(200, 40)
	interaction_bg.modulate = Color(0, 0, 0, 0.7)
	interaction_ui.add_child(interaction_bg)
	
	# Create interaction label
	interaction_label = Label.new()
	interaction_label.position = Vector2(10, 10)
	interaction_label.size = Vector2(180, 20)
	interaction_label.text = "Press E to view details"
	interaction_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	interaction_label.add_theme_color_override("font_color", Color.WHITE)
	interaction_label.add_theme_font_size_override("font_size", 14)
	interaction_ui.add_child(interaction_label)
	
	add_child(interaction_ui)

func setup_popup_ui():
	# Create popup container
	popup_container = Control.new()
	popup_container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	popup_container.visible = false
	popup_container.modulate = Color(1, 1, 1, 1)  # Ensure full visibility

	# Create semi-transparent overlay (optional dim background)
	var popup_overlay = Panel.new()
	popup_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	popup_overlay.self_modulate = Color(0, 0, 0, 0.5)  # Dim the background only, not its children
	popup_container.add_child(popup_overlay)

	# Create main popup panel
	popup_background = Panel.new()
	popup_background.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	popup_background.position = Vector2(-200, -150)
	popup_background.size = Vector2(400, 300)
	popup_background.self_modulate = Color(0.2, 0.2, 0.2, 0.95)  # Semi-transparent background only
	popup_container.add_child(popup_background)

	# Create title label
	popup_title = Label.new()
	popup_title.position = Vector2(20, 20)
	popup_title.size = Vector2(360, 30)
	popup_title.text = "Model Information"
	popup_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup_title.add_theme_color_override("font_color", Color.WHITE)
	popup_title.add_theme_font_size_override("font_size", 18)
	popup_background.add_child(popup_title)

	# Create description label
	popup_description = Label.new()
	popup_description.position = Vector2(20, 60)
	popup_description.size = Vector2(360, 180)
	popup_description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	popup_description.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	popup_description.add_theme_color_override("font_color", Color.WHITE)
	popup_description.add_theme_font_size_override("font_size", 12)
	popup_background.add_child(popup_description)

	# Create close button
	popup_close_button = Button.new()
	popup_close_button.position = Vector2(150, 250)
	popup_close_button.size = Vector2(100, 30)
	popup_close_button.text = "Close"
	popup_close_button.pressed.connect(_on_popup_close_pressed)
	popup_background.add_child(popup_close_button)

	add_child(popup_container)

func setup_pedestals():
	# Collect all pedestals from your scene structure
	pedestals = []
	
	# Try to find pedestals recursively
	find_pedestals_recursive(self)
	
	print("Found %d pedestals in scene" % pedestals.size())

func find_pedestals_recursive(node: Node):
	# Check if current node name contains "Pedestal" but is NOT just "Pedestals" (the container)
	if "Pedestal" in node.name and node.name != "Pedestals":
		pedestals.append(node)
	
	# Recursively check all children
	for child in node.get_children():
		find_pedestals_recursive(child)

func _process(delta: float) -> void:
	# Process GLTF queue (limit per frame for performance)
	var processed_this_frame = 0
	while pending_gltf_queue.size() > 0 and processed_this_frame < models_per_frame:
		var task = pending_gltf_queue.pop_front()
		process_gltf_task(task)
		processed_this_frame += 1
	
	# Rotate imported models
	for scene in imported_scenes:
		if scene and is_instance_valid(scene):
			scene.rotate_y(rotation_speed * delta)
	
	# Animate spinner
	spinner_timer += delta
	if spinner_timer >= 0.15:
		spinner_timer = 0.0
		spinner_index = (spinner_index + 1) % spinner_frames.size()
		update_loading_display()
	
	# Handle interaction detection
	if not popup_container.visible:
		check_model_interaction()
	else:
		interaction_ui.visible = false
		if currently_highlighted:
			remove_highlight(currently_highlighted)
			currently_highlighted = null
	
	# Handle input
	if Input.is_action_just_pressed("ui_accept") or Input.is_action_just_pressed("interact"):  # E key or Enter
		if currently_highlighted:
			show_model_popup(currently_highlighted)
	
	# Handle popup close with Escape
	if Input.is_action_just_pressed("ui_cancel") and popup_container.visible:  # Escape key
		hide_model_popup()

func check_model_interaction():
	if not camera:
		return

	var mouse_pos = get_viewport().get_mouse_position()
	var from = camera.project_ray_origin(mouse_pos)
	var to = from + camera.project_ray_normal(mouse_pos) * raycast_length

	var space_state = get_world_3d().direct_space_state
	var query = PhysicsRayQueryParameters3D.create(from, to)
	query.exclude = []
	query.collision_mask = 1  # Adjust if needed

	var result = space_state.intersect_ray(query)

	var target_model = null

	if result:
		var hit_node = result.collider

		for pedestal in pedestals:
			if is_node_descendant_of(hit_node, pedestal):
				if pedestal in pedestal_models:
					var distance = from.distance_to(result.position)
					if distance <= interaction_range:
						target_model = pedestal_models[pedestal]
						break

	# Update highlighting
	if target_model != currently_highlighted:
		if currently_highlighted:
			remove_highlight(currently_highlighted)

		currently_highlighted = target_model
		if currently_highlighted:
			add_highlight(currently_highlighted)
			interaction_ui.visible = true
		else:
			interaction_ui.visible = false

func process_gltf_task(task: Dictionary):
	var index = task["index"]
	var file_path = task["file_path"]

	if index >= pedestals.size():
		print("ERROR: No pedestal available for model %d" % (index + 1))
		model_states[index] = ModelState.ERROR
		return

	print("Processing GLTF for model %d..." % (index + 1))

	var gltf = GLTFDocument.new()
	var state = GLTFState.new()
	var err = gltf.append_from_file(file_path, state)

	if err != OK:
		print("ERROR: GLTF parsing error on model %d" % (index + 1))
		model_states[index] = ModelState.ERROR
		return

	var scene = gltf.generate_scene(state)
	if scene:
		place_model_on_pedestal(scene, index)
		model_states[index] = ModelState.LOADED
		models_loaded += 1
		update_loading_display()
		print("Model %d loaded successfully!" % (index + 1))
	else:
		print("ERROR: Failed to generate scene for model %d" % (index + 1))
		model_states[index] = ModelState.ERROR

func place_model_on_pedestal(scene: Node3D, index: int):
	var target_pedestal = pedestals[index]

	# Clear existing children (except StaticBody3D and CollisionShape3D)
	for child in target_pedestal.get_children():
		if child.name != "StaticBody3D" and not child is CollisionShape3D:
			child.queue_free()

	target_pedestal.add_child(scene)
	scene.transform = Transform3D.IDENTITY

	# Add collision detection
	for node in scene.get_children(true):
		if node is MeshInstance3D:
			node.add_to_group("ImportedMeshNodes")
			if not node.get_node_or_null("CollisionShape3D"):
				var shape = node.mesh.create_trimesh_shape()
				var static_body = StaticBody3D.new()
				var collision = CollisionShape3D.new()
				collision.shape = shape
				static_body.add_child(collision)
				node.add_child(static_body)

	fit_model_to_pedestal(scene, target_pedestal, 1.0)
	imported_scenes.append(scene)
	pedestal_models[target_pedestal] = scene

# Add cache management functions
func clear_model_cache():
	print("Clearing model cache...")

	# Remove all cache files
	for key in cache_db.keys():
		var entry = cache_db[key]
		if entry.has("file_path") and FileAccess.file_exists(entry.file_path):
			DirAccess.remove_absolute(entry.file_path)

	# Clear cache database
	cache_db.clear()
	save_cache_database()
	print("Model cache cleared")

func get_cache_info() -> Dictionary:
	var total_size = 0
	var file_count = 0

	for key in cache_db.keys():
		var entry = cache_db[key]
		if entry.has("file_path") and FileAccess.file_exists(entry.file_path):
			var file = FileAccess.open(entry.file_path, FileAccess.READ)
			if file:
				total_size += file.get_length()
				file.close()
				file_count += 1

	return {
		"file_count": file_count,
		"total_size_mb": total_size / (1024.0 * 1024.0),
		"cache_entries": cache_db.size()
	}

func is_node_descendant_of(node: Node, ancestor: Node) -> bool:
	var current = node
	while current:
		if current == ancestor:
			return true
		current = current.get_parent()
	return false

func add_highlight(model: Node3D):
	if not model or model in highlighted_models:
		return

	var mesh_nodes = get_mesh_nodes(model)
	var tweens = []

	for mesh_node in mesh_nodes:
		var mat := get_active_material(mesh_node)
		if mat and mat is StandardMaterial3D:
			# Duplicate the material to avoid editing shared resource
			var glow_mat := mat.duplicate()
			if glow_mat is StandardMaterial3D:
				glow_mat.emission_enabled = true
				glow_mat.emission = Color.CYAN
				glow_mat.emission_energy = 0.3
				mesh_node.set_surface_override_material(0, glow_mat)

				# Tween emission using a manual workaround via a dummy property
				var tween := model.create_tween().set_loops()
				var tween_value := 0.3

				tween.tween_method(
					func(value):
						glow_mat.emission_energy = value,
					tween_value, 1.0, 0.5
				).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

				tween.tween_method(
					func(value):
						glow_mat.emission_energy = value,
					1.0, 0.3, 0.5
				).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

				tweens.append(tween)

	highlighted_models[model] = {
		"tweens": tweens
	}

func remove_highlight(model: Node3D):
	if not model or not highlighted_models.has(model):
		return

	var data = highlighted_models[model]

	# Remove all override materials
	for mesh_node in get_mesh_nodes(model):
		mesh_node.set_surface_override_material(0, null)

	# Kill all tweens
	if data.has("tweens"):
		for tween in data["tweens"]:
			if is_instance_valid(tween):
				tween.kill()

	highlighted_models.erase(model)

func get_mesh_nodes(root: Node3D) -> Array:
	var meshes := []
	for child in root.get_children():
		if child is MeshInstance3D:
			meshes.append(child)
		elif child is Node3D:
			meshes += get_mesh_nodes(child)
	return meshes

func get_active_material(mesh_node: MeshInstance3D) -> Material:
	var material = mesh_node.get_surface_override_material(0)
	if not material and mesh_node.mesh:
		material = mesh_node.mesh.surface_get_material(0)
	return material

func add_glow_effect(model: Node3D):
	# Add glow outline to all mesh instances in the model
	for mesh_node in model.get_children(true):
		if mesh_node is MeshInstance3D:
			var material = mesh_node.get_surface_override_material(0)
			if not material:
				material = mesh_node.get_surface_override_material(0)
				if not material and mesh_node.mesh:
					material = mesh_node.mesh.surface_get_material(0)
			
			if material:
				# Create a new material with emission for glow
				var glow_material = material.duplicate()
				if glow_material is StandardMaterial3D:
					glow_material.emission_enabled = true
					glow_material.emission = Color.CYAN
					glow_material.emission_energy = 0.5
					mesh_node.set_surface_override_material(0, glow_material)

func remove_glow_effect(model: Node3D):
	# Remove glow effect from all mesh instances
	for mesh_node in model.get_children(true):
		if mesh_node is MeshInstance3D:
			mesh_node.set_surface_override_material(0, null)

func show_model_popup(model: Node3D):
	if not model:
		return

	var pedestal_index := -1
	for i in range(pedestals.size()):
		if pedestals[i] in pedestal_models and pedestal_models[pedestals[i]] == model:
			pedestal_index = i
			break

	if pedestal_index >= 0 and pedestal_index < model_info.size():
		var info = model_info[pedestal_index]

		var title : String = str(info.get("title", "Model %d" % (pedestal_index + 1)))
		var author : String = str(info.get("author", "Unknown Author"))
		var summary : String = str(info.get("summary", ""))
		var date : String = str(info.get("date", ""))

		popup_title.text = title

		var desc := ""
		if summary != "":
			desc += summary + "\n\n"
		desc += "Author: " + author
		if date != "":
			desc += "\nDate: " + date

		popup_description.text = desc
	else:
		popup_title.text = "3D Model"
		popup_description.text = "This is a 3D model loaded into the gallery."

	popup_container.visible = true
	var tween = create_tween()
	tween.tween_property(popup_container, "modulate", Color.WHITE, 0.3)

func hide_model_popup():
	# Hide popup with fade out animation
	var tween = create_tween()
	tween.tween_property(popup_container, "modulate", Color(1, 1, 1, 0), 0.3)
	tween.tween_callback(func(): popup_container.visible = false)

func _on_popup_close_pressed():
	hide_model_popup()

func setup_loading_indicator():
	# Create loading indicator container
	loading_container = Control.new()
	loading_container.set_anchors_and_offsets_preset(Control.PRESET_TOP_LEFT)
	loading_container.position = Vector2(10, 10)
	loading_container.size = Vector2(200, 40)
	
	# Create background panel
	loading_background = Panel.new()
	loading_background.size = Vector2(200, 40)
	loading_background.modulate = Color(0, 0, 0, 0.8)
	loading_container.add_child(loading_background)
	
	# Create counter label
	counter_label = Label.new()
	counter_label.position = Vector2(10, 5)
	counter_label.size = Vector2(180, 15)
	counter_label.text = "Models: 0/0"
	counter_label.add_theme_color_override("font_color", Color.WHITE)
	counter_label.add_theme_font_size_override("font_size", 12)
	loading_container.add_child(counter_label)
	
	# Create spinner label
	spinner_label = Label.new()
	spinner_label.position = Vector2(10, 20)
	spinner_label.size = Vector2(180, 15)
	spinner_label.text = ""
	spinner_label.add_theme_color_override("font_color", Color(0.8, 0.8, 1.0))
	spinner_label.add_theme_font_size_override("font_size", 11)
	loading_container.add_child(spinner_label)
	
	# Add to scene
	add_child(loading_container)

func update_loading_display():
	if not counter_label or not spinner_label:
		return
	
	# Update counter
	counter_label.text = "Models: %d/%d" % [models_loaded, models_total]
	
	# Update spinner (only show if loading)
	var loading_count = 0
	for state in model_states:
		if state == ModelState.DOWNLOADING or state == ModelState.LOADING:
			loading_count += 1
	
	if loading_count > 0:
		spinner_label.text = "%s Loading..." % spinner_frames[spinner_index]
	else:
		spinner_label.text = ""
	
	# Hide container when all models loaded
	if models_loaded >= models_total and models_total > 0:
		loading_container.visible = false
	else:
		loading_container.visible = true

@rpc("any_peer")
func set_model_urls(urls: Array):
	passed_model_urls = urls.duplicate()
	print("Received %d model URLs from JavaScript" % passed_model_urls.size())
	
	if passed_model_urls.is_empty():
		print("ERROR: No model URLs received from JavaScript")
		return
	
	# Limit to available pedestals
	var max_models = min(passed_model_urls.size(), pedestals.size())
	model_urls = passed_model_urls.slice(0, max_models)
	models_total = model_urls.size()
	models_loaded = 0
	update_loading_display()
	
	# Initialize model_info array with default information
	model_info = []
	for i in range(model_urls.size()):
		model_info.append({
			"title": "3D Model %d" % (i + 1),
			"summary": "This is a 3D model loaded from:\n%s\n\nClick and drag to rotate the camera and explore the gallery!" % model_urls[i]
		})
	
	if passed_model_urls.size() > pedestals.size():
		print("WARNING: %d models provided but only %d pedestals available" % [passed_model_urls.size(), pedestals.size()])
	
	current_download_index = 0  # Reset index
	initialization_complete = true
	# Use new progressive loading system
	start_progressive_loading()

func check_for_urls_with_retry():
	# Try checking for URLs multiple times with delays
	var max_attempts = 5
	var delay_between_attempts = 1.0
	
	for attempt in range(max_attempts):
		print("Checking for URLs, attempt %d/%d" % [attempt + 1, max_attempts])
		
		if check_for_javascript_urls():
			return  # Successfully found and loaded URLs
		
		# Wait before next attempt
		await get_tree().create_timer(delay_between_attempts).timeout
	
	print("No URLs found from JavaScript, using default test models")
	use_default_urls()

func check_for_javascript_urls() -> bool:
	print("Checking for JavaScript data...")
	var json_string = JavaScriptBridge.eval("window.latestModelDataJson")
	
	print("JavaScript result type: %s" % typeof(json_string))
	print("JavaScript result: %s" % str(json_string))

	if json_string != null and typeof(json_string) == TYPE_STRING and json_string.length() > 0:
		print("Found JavaScript data, parsing...")
		var json = JSON.new()
		if json.parse(json_string) == OK:
			var data_array = json.data
			print("Parsed JSON successfully, array size: %d" % data_array.size())
			if data_array is Array and data_array.size() > 0:
				var urls = []
				var info = []
				for entry in data_array:
					if typeof(entry) == TYPE_DICTIONARY and entry.has("url"):
						urls.append(entry["url"])
						info.append({
							"title": entry.get("title", "Untitled"),
							"author": entry.get("author", "Unknown Author"),
							"summary": entry.get("summary", ""),
							"date": entry.get("date", "Unknown")
						})
				print("Extracted %d URLs from JavaScript data" % urls.size())
				set_model_urls_and_info(urls, info)
				return true
		else:
			print("Failed to parse JSON from JavaScript")
	else:
		print("No valid JavaScript data found")
	
	print("No valid metadata found in window.latestModelDataJson")
	return false

@rpc("any_peer")
func set_model_urls_and_info(urls: Array, info: Array):
	if typeof(urls) != TYPE_ARRAY or typeof(info) != TYPE_ARRAY:
		print("ERROR: URLs or metadata not an array")
		return

	passed_model_urls = urls.duplicate()
	model_urls = urls.duplicate()
	model_info = info.duplicate()

	# Initialize states and cache keys
	model_states.resize(urls.size())
	model_cache_keys.resize(urls.size())

	for i in range(urls.size()):
		model_states[i] = ModelState.NONE
		model_cache_keys[i] = generate_cache_key(urls[i])

	print("Received %d model URLs and metadata" % urls.size())
	var max_models = min(model_urls.size(), pedestals.size())
	model_urls = model_urls.slice(0, max_models)
	model_info = model_info.slice(0, max_models)
	model_states = model_states.slice(0, max_models)
	model_cache_keys = model_cache_keys.slice(0, max_models)

	models_total = model_urls.size()
	models_loaded = 0
	update_loading_display()

	current_download_index = 0
	initialization_complete = true

	# Start progressive loading
	start_progressive_loading()

func start_progressive_loading():
	print("Starting progressive model loading for %d models..." % model_urls.size())
	
	if model_urls.size() == 0:
		print("ERROR: No model URLs to load!")
		return

	# Phase 1: Load high-priority models (first visible ones)
	for i in high_priority_models:
		if i < model_urls.size():
			print("Loading high-priority model %d" % i)
			load_model_async(i, true)  # High priority

	# Phase 2: Start background loading for remaining models
	await get_tree().create_timer(2.0).timeout  # Wait for high-priority models
	start_background_loading()

func start_background_loading():
	background_loading = true

	for i in range(model_urls.size()):
		if model_states[i] == ModelState.NONE:
			load_model_async(i, false)  # Low priority
			# Small delay between background downloads
			await get_tree().create_timer(0.5).timeout

func load_model_async(index: int, high_priority: bool = false):
	if index >= model_urls.size() or index >= pedestals.size():
		print("ERROR: Invalid index %d (urls: %d, pedestals: %d)" % [index, model_urls.size(), pedestals.size()])
		return

	var url = model_urls[index]
	var cache_key = model_cache_keys[index]
	
	print("Loading model %d from URL: %s" % [index + 1, url])

	# Check cache first
	if cache_db.has(cache_key):
		var cache_entry = cache_db[cache_key]
		var cached_file = cache_entry.get("file_path", "")

		if FileAccess.file_exists(cached_file):
			print("Loading model %d from cache" % (index + 1))
			model_states[index] = ModelState.CACHED
			load_model_from_cache(index, cached_file, high_priority)
			return

	# Download if not in cache
	print("Downloading model %d..." % (index + 1))
	model_states[index] = ModelState.DOWNLOADING
	update_loading_display()
	download_model_parallel(index, url, high_priority)
func download_model_parallel(index: int, url: String, high_priority: bool):
	# Find available HTTP request node
	var http_node = find_available_http_node()
	if not http_node:
		# Queue for later if all nodes busy
		await get_tree().create_timer(1.0).timeout
		download_model_parallel(index, url, high_priority)
		return

	var http_index = http_pool.find(http_node)

	# Store metadata for this request
	http_node.set_meta("busy", true)
	http_node.set_meta("model_index", index)
	http_node.set_meta("cache_key", model_cache_keys[index])
	http_node.set_meta("high_priority", high_priority)

	print("Downloading model %d/%d (parallel)..." % [index + 1, model_urls.size()])
	update_loading_display()
	var err = http_node.request(url)

	if err != OK:
		http_node.set_meta("busy", false)
		print("ERROR: Failed to request model %d" % (index + 1))
		model_states[index] = ModelState.ERROR
		update_loading_display()
		return

func find_available_http_node() -> HTTPRequest:
	for http in http_pool:
		if not http.get_meta("busy", false):
			return http
	return null

# Match Godot 4 signal order: (result, response_code, headers, body, bound_index)
func _on_http_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray, http_index: int) -> void:
	var http_node = http_pool[http_index]
	http_node.set_meta("busy", false)

	var model_index = http_node.get_meta("model_index", -1)
	var cache_key = http_node.get_meta("cache_key", "")
	var high_priority = http_node.get_meta("high_priority", false)

	if model_index == -1:
		print("ERROR: Invalid model index in HTTP response")
		return

	if response_code != 200:
		print("ERROR: Failed to download model %d (HTTP %d)" % [model_index + 1, response_code])
		model_states[model_index] = ModelState.ERROR
		update_loading_display()
		return

	# Save to cache
	var cache_file_path = "user://model_cache_%s.glb" % cache_key
	var file = FileAccess.open(cache_file_path, FileAccess.WRITE)
	if file:
		file.store_buffer(body)
		file.close()

		cache_db[cache_key] = {
			"file_path": cache_file_path,
			"timestamp": Time.get_unix_time_from_system(),
			"url": model_urls[model_index]
		}
		save_cache_database()

		print("Model %d cached successfully" % (model_index + 1))
		model_states[model_index] = ModelState.CACHED

		load_model_from_cache(model_index, cache_file_path, high_priority)
	else:
		print("ERROR: Failed to cache model %d" % (model_index + 1))
		model_states[model_index] = ModelState.ERROR
		update_loading_display()

func load_model_from_cache(index: int, file_path: String, high_priority: bool):
	model_states[index] = ModelState.LOADING

	# Add to processing queue
	pending_gltf_queue.append({
		"index": index,
		"file_path": file_path,
		"high_priority": high_priority
	})

	# Sort queue by priority (dict access via ["key"])
	pending_gltf_queue.sort_custom(func(a, b): return a["high_priority"] and not b["high_priority"])

func use_default_urls():
	print("Loading default test models...")
	
	# Use default URLs for testing
	var max_models = min(default_test_urls.size(), pedestals.size())
	var urls_to_use = default_test_urls.slice(0, max_models)
	
	# Create default info
	var info_to_use = []
	for i in range(urls_to_use.size()):
		info_to_use.append({
			"title": "Test Model %d" % (i + 1),
			"author": "Test Author",
			"summary": "Default test model",
			"date": "2024"
		})
	
	print("Using %d default test URLs" % urls_to_use.size())
	
	# Use the new progressive loading system
	set_model_urls_and_info(urls_to_use, info_to_use)

func fit_model_to_pedestal(model: Node3D, pedestal: Node3D, max_scale: float = 1.0) -> void:
	model.scale = Vector3.ONE
	model.position = Vector3.ZERO

	var aabb := get_combined_aabb(model)
	var model_size: Vector3 = aabb.size

	var pedestal_aabb := get_combined_aabb(pedestal, false)  # Don't filter by group for pedestals
	var pedestal_size: Vector3 = pedestal_aabb.size

	if pedestal_size.x == 0 or pedestal_size.y == 0 or pedestal_size.z == 0:
		print("Warning: Pedestal %s has zero size, using default" % pedestal.name)
		pedestal_size = Vector3(1, 1, 1)

	var scale_x = pedestal_size.x / model_size.x
	var scale_y = pedestal_size.y / model_size.y
	var scale_z = pedestal_size.z / model_size.z

	var uniform_scale = min(scale_x, scale_y, scale_z, max_scale)
	model.scale = Vector3.ONE * uniform_scale

	var offset = aabb.position + aabb.size * 0.5
	model.position -= offset * uniform_scale

	var pedestal_top_y = pedestal.global_transform.origin.y + pedestal_aabb.position.y + pedestal_aabb.size.y
	model.position.y = pedestal_top_y - aabb.position.y * uniform_scale

func get_combined_aabb(root: Node3D, filter_imported_only: bool = true) -> AABB:
	var first_aabb: AABB
	var has_first := false

	for mesh_node in root.get_children(true):
		if mesh_node is MeshInstance3D and (not filter_imported_only or mesh_node.is_in_group("ImportedMeshNodes")):
			var mesh_aabb: AABB = mesh_node.get_aabb()
			var global_aabb: AABB = mesh_aabb
			global_aabb.position += mesh_node.global_transform.origin - root.global_transform.origin

			if not has_first:
				first_aabb = global_aabb
				has_first = true
			else:
				first_aabb = first_aabb.merge(global_aabb)

	return first_aabb if has_first else AABB()

func setup_fullscreen_toggle():
	fullscreen_button = TextureButton.new()
	fullscreen_button.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
	fullscreen_button.tooltip_text = "Toggle Fullscreen"
	
	# Load icon
	fullscreen_button.texture_normal = load("res://icons/fullscreen.png")

	# Anchor to bottom-right
	fullscreen_button.anchor_left = 1.0
	fullscreen_button.anchor_top = 1.0
	fullscreen_button.anchor_right = 1.0
	fullscreen_button.anchor_bottom = 1.0

	fullscreen_button.offset_left = -60
	fullscreen_button.offset_top = -60
	fullscreen_button.offset_right = -10
	fullscreen_button.offset_bottom = -10

	fullscreen_button.pressed.connect(toggle_fullscreen)
	add_child(fullscreen_button)

func toggle_fullscreen():
	is_fullscreen = !is_fullscreen
	if is_fullscreen:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
		fullscreen_button.texture_normal = load("res://icons/windowed.png")
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		fullscreen_button.texture_normal = load("res://icons/fullscreen.png")
