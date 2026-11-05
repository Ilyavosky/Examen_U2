MATCH (s:Servicio)-[:DEPENDE_DE]->(:Servicio {nombre: "Pagos"})
RETURN s.nombre AS servicio_directo
ORDER BY servicio_directo;

MATCH p = (s:Servicio)-[:DEPENDE_DE*1..3]->(:Servicio {nombre: "Pagos"})
RETURN s.nombre AS servicio_afectado, min(length(p)) AS saltos
ORDER BY saltos, servicio_afectado;

MATCH p = (:Servicio)-[:DEPENDE_DE]->(:Servicio)
RETURN p;
