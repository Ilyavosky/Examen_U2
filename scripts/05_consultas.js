db = db.getSiblingDB("comercio_u2");

function runQuery(label, expectedIds, query, projection) {
  const docs = db.pedidos.find(query, projection).sort({ _id: 1 }).toArray();
  const ids = docs.map((d) => d._id);
  print("--- " + label + " ---");
  print("esperado: " + JSON.stringify(expectedIds));
  print("obtenido: " + JSON.stringify(ids));
  print("coincide: " + (JSON.stringify(expectedIds) === JSON.stringify(ids)));
  printjson(docs);
}

runQuery(
  "a) pendientes de prioridad alta (ID y cliente)",
  [1, 7],
  { estado: "pendiente", prioridad: "alta" },
  { clienteId: 1 }
);

runQuery(
  "b) pedidos del almacén Centro ordenados por ID",
  [2, 4, 6, 8, 11],
  { almacen: "Centro" },
  { almacen: 1, estado: 1 }
);

runQuery(
  "c) pedidos con total >= 3000 (ID e importe)",
  [1, 3, 5, 7, 9, 12],
  { total: { $gte: 3000 } },
  { total: 1 }
);

runQuery(
  "d) pedidos del 17 al 19 de octubre, inclusive",
  [5, 6, 7, 8, 9, 10],
  { fecha: { $gte: new Date(Date.UTC(2026, 9, 17, 0, 0, 0)), $lt: new Date(Date.UTC(2026, 9, 20, 0, 0, 0)) } },
  { fecha: 1 }
);

runQuery(
  "e) pedidos que contienen el SKU P03",
  [3, 7, 12],
  { "articulos.sku": "P03" },
  { articulos: 1 }
);

print("--- f) número de pedidos entregados ---");
print("esperado: 4");
const delivered = db.pedidos.countDocuments({ estado: "entregado" });
print("obtenido: " + delivered);
print("coincide: " + (delivered === 4));
