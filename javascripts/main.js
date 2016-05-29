var price1 = 5;
var price2 = 6;
var total = price1 + price2;
document.getElementById("demo").innerHTML =
"The total is: " + total;

var client = new Keen({
  projectId: "563a13c896773d4a75c3bf93",
  readKey: "9d45d36b3d3040533eb3a9f2e8bcc9e317d6b4e7e2cbb413ce959e7c0f8b926a7b82523fc0acd774ef024a0f4bddcc2bd8e992e2f61d9aed7b7f09bcb63bc0a1ebee2e0ebd0e2792dba3dc4ae1ae9c11c19e54753574a726dea4eec16e463aa06196d6876d167a9d668f236f25a8857d"

});

Keen.ready(function(){
  
  var query = new Keen.Query("count", {
    eventCollection: "collect",
    filters: [
    {
        "operator": "eq",
        "property_name": "coreid",
        "property_value": "51ff67065067545711360687"
    }
],
    timeframe: "this_14_days",
    timezone: "UTC"
  });
  
  client.draw(query, document.getElementById("my_chart"), {
    // Custom configuration here
  });
  
});



