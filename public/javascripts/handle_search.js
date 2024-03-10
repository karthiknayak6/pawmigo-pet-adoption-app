console.log("Hi");

const handleClick = () => {
  const loc = document.querySelector(".loc").value;
  const pet = document.querySelector(".petSelect").value;
  const breed = document.querySelector(".breed").value;

  var queryString = `?location=${loc}&pet=${pet}&breed=${breed}`;
  window.location.href = "/search" + queryString;
};
window.handleClick = handleClick;
