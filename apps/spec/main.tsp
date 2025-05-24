import "@typespec/http";

import "./models/transport.tsp";
import "./routes/busStops.tsp";
import "./routes/busStopGroups.tsp";

using Http;

@service(#{ title: "Tokyo University of Technology Bus Web API Service" })
@route("/api")
namespace BusAPI {

}
