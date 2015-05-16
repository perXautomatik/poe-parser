Path of exile trade forums parser written on javascript io.js platform. This backend similar to poe.trade, but this variant have open source code under GPLv2 license.

=== Interface

Parser for one trade section may be initialize as
```
var pparser = require("poe-parser");
var url = "Any path of exile forum trading forum, created by GGG"

pparser.indexPosts(url);
```

=== Database
By default, parser use mongodb through mongoose module. If you want to use another Database: see poe-parser\lib\database for details.
