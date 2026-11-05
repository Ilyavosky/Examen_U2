db = db.getSiblingDB("comercio_u2");

printjson(db.productos.createIndex({ sku: 1 }, { unique: true, name: "sku_unico" }));

print("índices de productos:");
printjson(db.productos.getIndexes());

print("productos antes: " + db.productos.countDocuments({}));

try {
  db.productos.insertOne({
    sku: "P01",
    nombre: "Computadora duplicada",
    precioUnitario: 14000,
    existencias: NumberInt(1),
    almacen: "Norte"
  });
  print("RESULTADO INESPERADO: el SKU duplicado fue aceptado");
} catch (e) {
  print("rechazado: si");
  print("code: " + e.code);
  print("codeName: " + (e.codeName || (e.code === 121 ? "DocumentValidationFailed" : e.code === 11000 ? "DuplicateKey" : "desconocido")));
  print("mensaje: " + e.message);
}

print("--- Verificación ---");
print("productos después: " + db.productos.countDocuments({}) + " (esperado 5)");
print("documentos con sku P01: " + db.productos.countDocuments({ sku: "P01" }) + " (esperado 1)");
print("existencias: " + JSON.stringify(db.productos.find({}, { _id: 0, sku: 1, existencias: 1 }).sort({ sku: 1 }).toArray().map((p) => p.sku + "=" + p.existencias)));

print("--- Distinción de errores ---");
print("índice único: code 11000 (DuplicateKey), mensaje 'E11000 duplicate key error', indica la clave repetida (sku).");
print("validación de esquema: code 121 (DocumentValidationFailed), mensaje 'Document failed validation', trae errInfo.details con la regla incumplida.");
