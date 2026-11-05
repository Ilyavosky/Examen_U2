db = db.getSiblingDB("comercio_u2");

function show(label, r) {
  print(label + ": matchedCount=" + r.matchedCount + ", modifiedCount=" + r.modifiedCount);
}

function stateOf(id) {
  return db.pedidos.findOne({ _id: id }).estado;
}

function stockOf(sku) {
  return db.productos.findOne({ sku: sku }).existencias;
}

print("=== Ítem 8: actualización condicionada del pedido 1 ===");
print("estado inicial del pedido 1: " + stateOf(1));

show("1er intento pendiente -> preparacion (esperado 1/1)",
  db.pedidos.updateOne({ _id: 1, estado: "pendiente" }, { $set: { estado: "preparacion" } }));
print("estado actual: " + stateOf(1));

show("2o intento con el mismo filtro (esperado 0/0)",
  db.pedidos.updateOne({ _id: 1, estado: "pendiente" }, { $set: { estado: "preparacion" } }));
print("estado actual: " + stateOf(1));

show("restitución preparacion -> pendiente (esperado 1/1)",
  db.pedidos.updateOne({ _id: 1, estado: "preparacion" }, { $set: { estado: "pendiente" } }));
print("estado final: " + stateOf(1) + " (esperado pendiente)");

print("--- Reserva de una unidad de P01 ---");
print("existencias iniciales P01: " + stockOf("P01"));

show("reserva imposible de 100 unidades (esperado 0/0)",
  db.productos.updateOne({ sku: "P01", existencias: { $gte: 100 } }, { $inc: { existencias: -100 } }));
print("existencias P01: " + stockOf("P01") + " (esperado 8)");

show("reserva de 1 unidad (esperado 1/1)",
  db.productos.updateOne({ sku: "P01", existencias: { $gte: 1 } }, { $inc: { existencias: -1 } }));
print("existencias P01: " + stockOf("P01") + " (esperado 7)");

show("reposición de 1 unidad (esperado 1/1)",
  db.productos.updateOne({ sku: "P01" }, { $inc: { existencias: 1 } }));
print("existencias P01: " + stockOf("P01") + " (esperado 8)");

print("=== Ítem 9: etiquetas con $addToSet y $pull en el pedido 3 ===");
print("etiquetas iniciales: " + JSON.stringify(db.pedidos.findOne({ _id: 3 }).etiquetas));

show("1er $addToSet 'revision' (esperado 1/1)",
  db.pedidos.updateOne({ _id: 3 }, { $addToSet: { etiquetas: "revision" } }));
print("etiquetas: " + JSON.stringify(db.pedidos.findOne({ _id: 3 }).etiquetas));

show("2o $addToSet 'revision' (esperado 1/0, no duplica)",
  db.pedidos.updateOne({ _id: 3 }, { $addToSet: { etiquetas: "revision" } }));
print("etiquetas: " + JSON.stringify(db.pedidos.findOne({ _id: 3 }).etiquetas));

show("$pull 'revision' (esperado 1/1)",
  db.pedidos.updateOne({ _id: 3 }, { $pull: { etiquetas: "revision" } }));
print("etiquetas finales: " + JSON.stringify(db.pedidos.findOne({ _id: 3 }).etiquetas) + " (esperado [\"web\",\"alta\"])");

print("--- Pedido temporal _id 99 ---");
const temp = {
  _id: 99,
  clienteId: "C05",
  almacen: "Centro",
  prioridad: "baja",
  estado: "pendiente",
  fecha: new Date(Date.UTC(2026, 9, 21, 12, 0, 0)),
  articulos: [{ sku: "P04", cantidad: NumberInt(2), precioUnitario: 300 }],
  total: 600,
  etiquetas: ["web", "baja"]
};
print("inserción aceptada: " + db.pedidos.insertOne(temp).acknowledged);
print("pedidos con el temporal: " + db.pedidos.countDocuments({}) + " (esperado 13)");
const removed = db.pedidos.deleteOne({ _id: 99 });
print("deletedCount: " + removed.deletedCount + " (esperado 1)");

print("=== Verificación final ===");
const ids = db.pedidos.find({}, { _id: 1 }).sort({ _id: 1 }).toArray().map((d) => d._id);
print("pedidos: " + db.pedidos.countDocuments({}) + " (esperado 12)");
print("ids: " + JSON.stringify(ids));
print("ids correctos 1..12: " + (JSON.stringify(ids) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])));
print("existe _id 99: " + (db.pedidos.countDocuments({ _id: 99 }) > 0) + " (esperado false)");
print("productos: " + db.productos.countDocuments({}) + " (esperado 5)");
const stock = db.productos.find({}, { _id: 0, sku: 1, existencias: 1 }).sort({ sku: 1 }).toArray().map((p) => p.sku + "=" + p.existencias);
print("existencias: " + JSON.stringify(stock));
print("existencias iniciales: " + (JSON.stringify(stock) === JSON.stringify(["P01=8", "P02=40", "P03=12", "P04=50", "P05=15"])));
print("estado del pedido 1: " + stateOf(1) + " (esperado pendiente)");
