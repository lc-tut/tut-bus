import "@typespec/http";

import "./models/transport.tsp";
import "./routes/busStops.tsp";
import "./routes/busStopGroups.tsp";

using Http;

@service(#{ title: "Tokyo University of Technology Bus Web API Service" })
@server("http://localhost:8000", "local-dev")
@server("https://hogehoge.example.com", "prod")
@route("/api")
namespace BusAPI {

}
