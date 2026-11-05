db = db.getSiblingDB("comercio_u2");

const status = db.runCommand({ connectionStatus: 1 }).authInfo;
print("usuario autenticado: " + status.authenticatedUsers.map((u) => u.user).join(", "));
print("roles: " + JSON.stringify(status.authenticatedUserRoles));

print("--- Operación permitida: consulta ---");
print("pedidos: " + db.pedidos.countDocuments({}));
printjson(db.pedidos.findOne({ _id: 1 }, { clienteId: 1, estado: 1 }));
print("pedidos pendientes de prioridad alta: " + JSON.stringify(db.pedidos.find({ estado: "pendiente", prioridad: "alta" }, { _id: 1 }).sort({ _id: 1 }).toArray().map((d) => d._id)));

print("--- Operación rechazada: modificar el pedido 1 ---");
try {
  const r = db.pedidos.updateOne({ _id: 1, estado: "pendiente" }, { $set: { estado: "preparacion" } });
  print("RESULTADO INESPERADO: la modificación fue aceptada, modifiedCount=" + r.modifiedCount);
} catch (e) {
  print("rechazado: si");
  print("code: " + e.code);
  print("codeName: " + (e.codeName || (e.code === 13 ? "Unauthorized" : "desconocido")));
  print("mensaje: " + e.message);
}

print("--- Operación rechazada: insertar un pedido ---");
try {
  db.pedidos.insertOne({ _id: 98, clienteId: "C09" });
  print("RESULTADO INESPERADO: la inserción fue aceptada");
} catch (e) {
  print("rechazado: si");
  print("code: " + e.code);
  print("mensaje: " + e.message);
}

print("--- Verificación ---");
print("estado del pedido 1: " + db.pedidos.findOne({ _id: 1 }).estado + " (esperado pendiente)");
print("pedidos: " + db.pedidos.countDocuments({}) + " (esperado 12)");
