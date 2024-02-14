console.log("Hi");

const handleClick = () => {
  const loc = document.querySelector(".loc").value;
  const pet = document.querySelector(".petSelect").value;
  const breed = document.querySelector(".breedSelect").value;
  var queryString = `?location=${loc}&pet=${pet}&breed=${breed}`;
  window.location.href = "/search/pets" + queryString;
};
window.handleClick = handleClick;
