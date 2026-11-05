db = db.getSiblingDB("comercio_u2");

print("pedidos antes: " + db.pedidos.countDocuments({}));

const tests = [
  {
    name: "cantidad cero",
    rule: "articulos.cantidad debe ser entero con minimum 1",
    doc: {
      _id: 100,
      clienteId: "C01",
      almacen: "Centro",
      prioridad: "media",
      estado: "pendiente",
      fecha: new Date(Date.UTC(2026, 9, 21, 12, 0, 0)),
      articulos: [{ sku: "P02", cantidad: NumberInt(0), precioUnitario: 500 }],
      total: 500,
      etiquetas: ["web", "media"]
    }
  },
  {
    name: "estado no admitido",
    rule: "estado debe pertenecer a [pendiente, preparacion, enviado, entregado]",
    doc: {
      _id: 101,
      clienteId: "C02",
      almacen: "Centro",
      prioridad: "media",
      estado: "cancelado",
      fecha: new Date(Date.UTC(2026, 9, 21, 12, 0, 0)),
      articulos: [{ sku: "P02", cantidad: NumberInt(1), precioUnitario: 500 }],
      total: 500,
      etiquetas: ["web", "media"]
    }
  }
];

tests.forEach((t) => {
  print("--- Prueba: " + t.name + " ---");
  print("regla esperada: " + t.rule);
  try {
    db.pedidos.insertOne(t.doc);
    print("RESULTADO INESPERADO: el documento fue aceptado");
    db.pedidos.deleteOne({ _id: t.doc._id });
  } catch (e) {
    print("rechazado: si");
    print("code: " + e.code);
    print("codeName: " + (e.codeName || (e.code === 121 ? "DocumentValidationFailed" : e.code === 11000 ? "DuplicateKey" : "desconocido")));
    print("mensaje: " + e.message);
    if (e.errInfo && e.errInfo.details) {
      print("detalle de la regla incumplida:");
      printjson(e.errInfo.details);
    }
  }
});

print("--- Verificación ---");
print("pedidos después: " + db.pedidos.countDocuments({}) + " (esperado 12)");
print("pedidos con _id 100 o 101: " + db.pedidos.countDocuments({ _id: { $in: [100, 101] } }) + " (esperado 0)");
const schema = db.getCollectionInfos({ name: "pedidos" })[0].options.validator.$jsonSchema;
print("pedidos que incumplen el esquema: " + db.pedidos.countDocuments({ $nor: [{ $jsonSchema: schema }] }) + " (esperado 0)");
