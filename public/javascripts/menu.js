document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menu-toggle");
  const menuContent = document.getElementById("menu-content");

  menuToggle.addEventListener("click", function () {
    menuContent.classList.toggle("hidden");
  });

  // Close menu when clicking outside
  window.addEventListener("click", function (event) {
    if (
      !menuToggle.contains(event.target) &&
      !menuContent.contains(event.target)
    ) {
      menuContent.classList.add("hidden");
    }
  });
});
