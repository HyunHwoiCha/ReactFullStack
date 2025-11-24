document.addEventListener("DOMContentLoaded", function(){
	const menu = document.querySelector(".menu__icon");
	const navMenu = document.querySelector(".side__menu");
	const closeBtn = document.querySelector(".close__btn");

	menu.addEventListener("click", () => {
		navMenu.classList.toggle("active");
		const expanded = navMenu.classList.contains("active");
		menu.setAttribute("aria-expanded", expanded ? "true" : "false");
	});

	closeBtn.addEventListener("click", () => {
		navMenu.classList.remove("active");
	});
});