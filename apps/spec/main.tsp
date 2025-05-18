import "@typespec/http";

using Http;

@service(#{
  title: "Tokyo University of Technology Bus Web API Service"
})
@route("/api")
namespace API {}

