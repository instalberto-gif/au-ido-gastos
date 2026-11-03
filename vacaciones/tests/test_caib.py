import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("caib", Path(__file__).resolve().parents[2] / "scripts" / "update_caib.py")
caib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(caib)

class CalendarTests(unittest.TestCase):
    def fixture(self, year=2027):
        rows = [(1, "enero", "Nuevo"), (6, "enero", "Reyes"), (1, "marzo", "Balears"),
                (25, "marzo", "Jueves Santo"), (26, "marzo", "Viernes Santo"),
                (29, "marzo", "Pascua"), (1, "mayo", "Trabajo"), (12, "octubre", "Nacional"),
                (1, "noviembre", "Todos Santos"), (6, "diciembre", "Constitución"),
                (8, "diciembre", "Inmaculada"), (25, "diciembre", "Navidad")]
        table = "".join(f"<tr><td>{d} de {m}</td><td>{n}</td></tr>" for d, m, n in rows)
        return f"<h3>CALENDARIO LABORAL GENERAL Y LOCAL ILLES BALEARS AÑO {year}</h3><table>{table}</table><table><tr><td>PALMANYOLA</td><td>20 de enero: Otro<br>21 de septiembre: Otro</td></tr><tr><td>PALMA</td><td>20 de enero: San Sebastián<br>24 de junio: San Juan</td></tr><tr><td>PETRA</td><td>1 de julio: Otro</td></tr></table>"
    def test_complete_and_palma_only(self):
        rows = caib.parse_html(self.fixture(), 2027)
        self.assertEqual(len(rows), 14)
        self.assertEqual([r["date"] for r in rows if r["scope"] == "palma"], ["2027-01-20", "2027-06-24"])
    def test_wrong_year_rejected(self):
        with self.assertRaises(ValueError):
            caib.parse_html(self.fixture(), 2028)
    def test_missing_local_rejected(self):
        with self.assertRaises(ValueError):
            caib.parse_html(self.fixture().replace("PALMA</td>", "OTHER</td>"), 2027)
    def test_missing_general_rejected(self):
        with self.assertRaises(ValueError):
            caib.parse_html(self.fixture().replace("25 de diciembre", "sin fecha"), 2027)
    def test_names_are_split(self):
        rows = caib.parse_dates("20 de enero: San Sebastián 24 de junio: San Juan", 2027, "palma")
        self.assertEqual([r["name"] for r in rows], ["San Sebastián", "San Juan"])

if __name__ == "__main__":
    unittest.main()
