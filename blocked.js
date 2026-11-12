(function () {
  var params = new URLSearchParams(location.search);
  var host = params.get("host");
  if (host) document.getElementById("hostText").textContent = host;
  document.getElementById("closeBtn").addEventListener("click", function () {
    window.close();
  });
})();
