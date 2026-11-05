db = db.getSiblingDB("comercio_u2");

const status = db.runCommand({ connectionStatus: 1 }).authInfo;
print("usuario autenticado: " + status.authenticatedUsers.map((u) => u.user).join(", "));
print("roles: " + JSON.stringify(status.authenticatedUserRoles));

function show(label, r) {
  print(label + ": matchedCount=" + r.matchedCount + ", modifiedCount=" + r.modifiedCount);
}

print("--- Operación permitida: actualizar y restituir el pedido 1 ---");
print("estado inicial: " + db.pedidos.findOne({ _id: 1 }).estado);
show("pendiente -> preparacion (esperado 1/1)",
  db.pedidos.updateOne({ _id: 1, estado: "pendiente" }, { $set: { estado: "preparacion" } }));
print("estado actual: " + db.pedidos.findOne({ _id: 1 }).estado);
show("preparacion -> pendiente (esperado 1/1)",
  db.pedidos.updateOne({ _id: 1, estado: "preparacion" }, { $set: { estado: "pendiente" } }));
print("estado final: " + db.pedidos.findOne({ _id: 1 }).estado + " (esperado pendiente)");

print("--- Operación rechazada: escribir en otra_base_tienda ---");
const other = db.getSiblingDB("otra_base_tienda");
try {
  const r = other.prueba.insertOne({ nota: "intento no autorizado" });
  print("RESULTADO INESPERADO: la escritura fue aceptada, _id=" + r.insertedId);
  other.prueba.deleteOne({ _id: r.insertedId });
} catch (e) {
  print("rechazado: si");
  print("code: " + e.code);
  print("codeName: " + (e.codeName || (e.code === 13 ? "Unauthorized" : "desconocido")));
  print("mensaje: " + e.message);
}

print("--- Verificación ---");
print("pedidos: " + db.pedidos.countDocuments({}) + " (esperado 12)");
print("estado del pedido 1: " + db.pedidos.findOne({ _id: 1 }).estado + " (esperado pendiente)");
