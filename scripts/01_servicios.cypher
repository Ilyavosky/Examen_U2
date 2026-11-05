CREATE CONSTRAINT servicio_nombre IF NOT EXISTS FOR (s:Servicio) REQUIRE s.nombre IS UNIQUE;

UNWIND ["Checkout", "Pedidos", "Pagos", "Inventario", "Notificaciones", "Analitica"] AS nombre
MERGE (:Servicio {nombre: nombre});

UNWIND [
  ["Checkout", "Pedidos"],
  ["Checkout", "Pagos"],
  ["Pedidos", "Pagos"],
  ["Pedidos", "Inventario"],
  ["Notificaciones", "Pedidos"],
  ["Notificaciones", "Pagos"],
  ["Analitica", "Pedidos"]
] AS par
MATCH (origen:Servicio {nombre: par[0]}), (destino:Servicio {nombre: par[1]})
MERGE (origen)-[:DEPENDE_DE]->(destino);

MATCH (s:Servicio) RETURN count(s) AS servicios;

MATCH ()-[r:DEPENDE_DE]->() RETURN count(r) AS relaciones;
