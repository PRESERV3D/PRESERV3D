
<template>
  <footer class="footer">
    <div class="footer-content">
      <p class="copyright">
        © 2025 by Polytechnic University of the Philippines. All rights reserved.
      </p>
      <div class="footer-links">
        <a href="https://www.pup.edu.ph/terms/" class="footer-link">Terms of Use</a>
        <span class="separator">|</span>
        <a href="https://www.pup.edu.ph/privacy/" class="footer-link">Privacy Policy</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  color: #7c7c7c;
  padding: 1.5rem 2rem;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.copyright {
  font-size: 0.8rem;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-link {
  color: #7c7c7c;
  text-decoration: none;
  font-size: 0.8rem;
  transition: opacity 0.3s ease;
}

.footer-link:hover {
  color: #880000;
  opacity: 0.8;
  text-decoration: underline;
}

.separator {
  color: rgb(124, 124, 124);
}

@media (min-width: 768px) {
  .footer-content {
    flex-direction: row;
    justify-content: space-between;
  }
}

@media (min-width: 1025px) {
  .footer {
    margin-left: 100px;
    width: calc(100% - 100px);
  }
}

@media (min-width: 600px) and (max-width: 1024px) {
  .footer {
    margin-left: 100px;
    width: calc(100% - 100px);
  }
}

@media (max-width: 599px) {
  .footer {
    margin-left: 100px;
    width: calc(100% - 100px);
    padding: 1.5rem 1rem;
  }

  .copyright {
    font-size: 0.7rem;
  }

  .footer-links {
    font-size: 0.7rem;
  }
}
</style>
