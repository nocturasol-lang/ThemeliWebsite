"""
THEMELI — Import projects from client Excel spreadsheet into SQLite.
One-time script. Run from project root:
    python scripts/import-projects.py
"""

import sqlite3
import os
import json
import re
import sys

# Ensure UTF-8 output on Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    import pandas as pd
except ImportError:
    print("pandas is required: pip install pandas openpyxl")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(PROJECT_ROOT, 'data', 'themeli.sqlite')
EXCEL_PATH = os.path.join(os.path.dirname(PROJECT_ROOT), 'ref',
    'Αντίγραφο του Πίνακας Εκτελεσμένων Έργων- Δήμητρα ΝΕΟ.xlsx')

# ── Typology classification ────────────────────────────────
TYPOLOGY_RULES = [
    ('Railways', [
        'σιδηροδρομικ', 'γραμμή', 'γραμμής', 'γραμμών', 'ΟΣΕ', 'τραμ',
        'σιδηρόδρομ', 'σιδηροτροχι',
    ]),
    ('Tunnels', [
        'σήραγγ', 'σηράγγ', 'υπόγει',
    ]),
    ('Dams', [
        'φράγμα', 'φράγματ', 'εκτροπής',
    ]),
    ('Ports & Marine', [
        'λιμέν', 'λιμάν', 'λιμεν', 'θαλάσσ', 'αλιευτικ',
    ]),
    ('Industrial & Energy', [
        'ΔΕΗ', 'διυλιστ', 'ενεργ', 'βιομηχαν', 'αιολικ', 'cogeneration',
        'motor oil', 'αεριοστρόβιλ', 'αποθήκευση', 'δεξαμεν',
        'πετρελαι', 'εργοστάσ',
    ]),
    ('Utility Networks', [
        'αποχέτευ', 'αποχετευτ', 'ύδρευσ', 'υδρευ', 'δίκτυ', 'δικτύ',
        'αγωγ', 'συλλεκτήρ', 'ομβρίων', 'λυμάτ', 'ΔΕΥΑ',
        'φρεάτι', 'φρεατίων', 'αντιπλημμυρ', 'ρέμματ', 'ρεμάτ',
        'Κηφισ', 'πολυαιθυλ', 'φυσικού αερίου', 'ΔΕΔΑ',
    ]),
    ('Roadworks', [
        'οδού', 'οδικ', 'γέφυρα', 'κόμβ', 'οδοποιία', 'λεωφόρ',
        'αυτοκινητόδρομ', 'Εγνατία', 'ΠΑΘΕ', 'κυκλοφοριακ',
    ]),
    ('Urban Redevelopment', [
        'αστικ', 'αναπλ', 'διαμόρφω', 'πλατεί', 'πεζοδρομ',
    ]),
    ('Buildings', [
        'κτίρι', 'κτηρί', 'νοσοκομεί', 'σχολ', 'ανέγερση', 'οικοδομ',
        'υποκατάστημα', 'οινοποιεί', 'αποθήκ',
    ]),
]

# ── Short title generation ─────────────────────────────────

# Prefixes to strip (order matters — longer/more specific first)
STRIP_PREFIXES = [
    'Κατασκευή και τοποθέτηση', 'Κατασκευή και συντήρηση',
    'Κατασκευή έργων', 'Κατασκευή του', 'Κατασκευή των', 'Κατασκευή της',
    'Κατασκευή νέου', 'Κατασκευή νέας', 'Κατασκευή',
    'Ανέγερση νέου κτιρίου', 'Ανέγερση νέου', 'Ανέγερση νέας', 'Ανέγερση',
    'Οικοδομικές εργασίες κτιρίων και Περιβάλλοντος χώρου',
    'Οικοδομικές εργασίες &', 'Οικοδομικές εργασίες',
    'Εργασίες συντήρησης', 'Εργασίες',
    'Συνέχιση της κατασκευής των', 'Συνέχιση της κατασκευής',
    'Αντικατάσταση και αναβάθμιση', 'Αντικατάσταση',
    'Συντήρηση και αναβάθμιση', 'Συντήρηση',
    'Επέκταση και βελτίωση', 'Επέκταση',
    'Αποκατάσταση και βελτίωση', 'Αποκατάσταση',
    'Βελτίωση και αναβάθμιση', 'Βελτίωση',
    'Προμήθεια και εγκατάσταση', 'Προμήθεια',
    'Διευθέτηση τμημ.', 'Διευθέτηση',
    'Αναδιευθέτηση',
]

# Filler phrases to clean up
FILLER_PHRASES = [
    'και Συναφών Έργων', 'και συναφών έργων',
    'και Περιβάλλοντος χώρου', 'στην περιοχή δικαιοδοσίας του τμήματος',
    'Η/Μ εγκαταστάσεις', 'νέου κτιριακού συγκροτήματος',
    'χωματουργικών και τεχνικών έργων μεταξύ χλμ',
    'χωματουργικών και τεχνικών έργων',
    'και τεχνικών έργων',
    'κεντρικού και βόρειου τμήματος πόλης',
    'και συνδέσεις οικιακών και εμπορικών πελατών',
    'δικτύου χαμηλής πίεσης',
]

# Genitive → nominative mappings for common construction terms
GENITIVE_TO_NOM = [
    (r'\bκτιρίου\b', 'Κτίριο'), (r'\bνοσοκομείου\b', 'Νοσοκομείο'),
    (r'\bυποκαταστήματος\b', 'Υποκατάστημα'), (r'\bοινοποιείου\b', 'Οινοποιείο'),
    (r'\bσήραγγας\b', 'Σήραγγα'), (r'\bσηράγγων\b', 'Σήραγγες'),
    (r'\bγέφυρας\b', 'Γέφυρα'), (r'\bγεφυρών\b', 'Γέφυρες'),
    (r'\bφράγματος\b', 'Φράγμα'), (r'\bρέμματος\b', 'Ρέμμα'),
    (r'\bαγωγού\b', 'Αγωγός'), (r'\bαγωγών\b', 'Αγωγοί'),
    (r'\bδικτύων\b', 'Δίκτυα'), (r'\bδικτύου\b', 'Δίκτυο'),
    (r'\bλιμένος\b', 'Λιμένας'), (r'\bλιμένα\b', 'Λιμένας'),
    (r'\bσυλλεκτήρων\b', 'Συλλεκτήρες'),
    (r'\bέργων\b', 'Έργα'), (r'\bκόμβου\b', 'Κόμβος'),
    (r'\bσταθμού\b', 'Σταθμός'), (r'\bαμαξοστασίου\b', 'Αμαξοστάσιο'),
    (r'\bαεροδρομίου\b', 'Αεροδρόμιο'), (r'\bαερολιμένα\b', 'Αερολιμένας'),
]


def generate_short_title(long_name):
    """Generate a clean short title from a long technical Greek project name."""
    title = long_name.strip()

    # Remove quotes and special markers
    title = re.sub(r'[«»""\u201c\u201d]', '', title)

    # Strip known prefixes
    for prefix in STRIP_PREFIXES:
        if title.lower().startswith(prefix.lower()):
            title = title[len(prefix):].strip()
            # Remove leading articles/prepositions/adjectives left over
            title = re.sub(r'^(?:(?:του|της|των|τα|τη|το|τον|στο|στη|στα|στον|στην|στους|για)\s+)+', '', title, flags=re.IGNORECASE)
            # Remove leading adjectives in genitive (e.g. "γενικού", "κεντρικού", "νέου")
            title = re.sub(r'^(?:\w+(?:ού|ής|ών|ικού|ικής|ικών|αίου|αίας)\s+)+', '', title, flags=re.IGNORECASE)
            break

    # Clean up filler phrases
    for filler in FILLER_PHRASES:
        title = re.sub(re.escape(filler), '', title, flags=re.IGNORECASE)

    # Remove parenthetical codes like (εργολαβία Μ4), (Α.Δ. 2112Α), (4bar)
    title = re.sub(r'\s*\([^)]*\)', '', title)

    # Remove trailing contract/lot references
    title = re.sub(r'\s*(?:εργολαβία|Εργολαβία)\s+\S+\s*$', '', title)

    # Remove leading code references like "Κ02/85:" or "PROJECT: 0321-CS1799 -"
    title = re.sub(r'^[A-ZΑ-Ω0-9/\-]+\s*:\s*', '', title)
    title = re.sub(r'^PROJECT:\s*\S+\s*-\s*', '', title, flags=re.IGNORECASE)

    # Convert genitive to nominative for first key noun
    for gen_pattern, nom_form in GENITIVE_TO_NOM:
        if re.search(gen_pattern, title, re.IGNORECASE):
            # Strip adjective+article chains before the noun: "του γενικού", "του νέου", etc.
            title = re.sub(r'(?:(?:του|της|των|το|τη)\s+(?:\w+\s+)*?)' + gen_pattern,
                          nom_form, title, count=1, flags=re.IGNORECASE)
            # Also try standalone replacement if above didn't match
            title = re.sub(gen_pattern, nom_form, title, count=1, flags=re.IGNORECASE)
            break

    # Clean up double spaces, leading/trailing punctuation
    title = re.sub(r'\s+', ' ', title).strip()
    title = title.strip(' ,-–—.')

    # Capitalize first letter
    if title:
        title = title[0].upper() + title[1:]

    # If still too long (>70 chars), truncate at a natural break
    if len(title) > 70:
        for sep in [' - ', ' – ', ', ', ' στο ', ' στη ', ' στην ']:
            pos = title.find(sep, 25)
            if 25 < pos < 65:
                title = title[:pos]
                break
        else:
            if len(title) > 70:
                title = title[:67].rsplit(' ', 1)[0] + '...'

    return title


# ── Location extraction ─────────────────────────────────────
# Map of known place names to extract from project text
# (search_term, location_label, region)
LOCATION_MAP = [
    # Islands
    ('ΚΩ', 'Κως', 'Islands'), ('Κως', 'Κως', 'Islands'),
    ('Κέα', 'Κέα', 'Islands'), ('Κεωσ', 'Κέα', 'Islands'),
    ('Λέσβο', 'Λέσβος', 'Islands'), ('Μυτιλήν', 'Μυτιλήνη', 'Islands'),
    ('Χίου', 'Χίος', 'Islands'), ('Χίο', 'Χίος', 'Islands'),
    ('Σαλαμίν', 'Σαλαμίνα', 'Attica'), ('Σκιάθο', 'Σκιάθος', 'Islands'),
    # Crete
    ('Κρήτη', 'Κρήτη', 'Crete'), ('Χερσόνησο', 'Χερσόνησος', 'Crete'),
    ('Γούρνες', 'Ηράκλειο', 'Crete'), ('Β.Ο.Α.Κ', 'Κρήτη', 'Crete'),
    # Attica
    ('Αθήνα', 'Αθήνα', 'Attica'), ('Αθηνών', 'Αθήνα', 'Attica'), ('Αθηναίων', 'Αθήνα', 'Attica'),
    ('Πειραι', 'Πειραιάς', 'Attica'), ('Ελληνικό', 'Ελληνικό', 'Attica'),
    ('Φιλοθέη', 'Φιλοθέη', 'Attica'), ('Χαλανδρ', 'Χαλανδρί', 'Attica'),
    ('Γαλατσ', 'Γαλάτσι', 'Attica'), ('Ψυχικό', 'Ψυχικό', 'Attica'),
    ('Φαλήρου', 'Παλαιό Φάληρο', 'Attica'), ('Αλίμου', 'Άλιμος', 'Attica'),
    ('Ελευσίν', 'Ελευσίνα', 'Attica'), ('Αργυρούπολη', 'Αργυρούπολη', 'Attica'),
    ('Κηφισ', 'Αθήνα', 'Attica'), ('Πρωτεύουσ', 'Αθήνα', 'Attica'),
    ('Λιοσίων', 'Ίλιον', 'Attica'), ('Ν. Ιωνίας', 'Νέα Ιωνία', 'Attica'),
    ('Πεύκη', 'Πεύκη', 'Attica'), ('Βούλα', 'Βούλα', 'Attica'),
    ('Ασπρόπυργο', 'Ασπρόπυργος', 'Attica'), ('Μαραθών', 'Μαραθώνας', 'Attica'),
    ('Πατησίων', 'Αθήνα', 'Attica'), ('Παπάγου', 'Παπάγου', 'Attica'),
    ('Λαύριο', 'Λαύριο', 'Attica'), ('Τραχών', 'Άλιμος', 'Attica'),
    ('Φωκίωνος Νέγρη', 'Αθήνα', 'Attica'), ('Φιλοθέης', 'Φιλοθέη', 'Attica'),
    ('ΦΙΛΟΘΕΗΣ', 'Φιλοθέη', 'Attica'), ('ΚΗΦΙΣΙΑ', 'Κηφισιά', 'Attica'),
    ('Αττικής', 'Αττική', 'Attica'), ('ΑΤΤΙΚΗΣ', 'Αττική', 'Attica'),
    ('ΕΔΑ ΑΤΤΙΚΗΣ', 'Αττική', 'Attica'),
    # Peloponnese
    ('Κόρινθο', 'Κόρινθος', 'Peloponnese'), ('Κορίνθου', 'Κόρινθος', 'Peloponnese'),
    ('Καλαμάτα', 'Καλαμάτα', 'Peloponnese'), ('Ναυπλ', 'Ναύπλιο', 'Peloponnese'),
    ('Σικυων', 'Σικυώνα', 'Peloponnese'), ('Διμηνιού', 'Σικυώνα', 'Peloponnese'),
    ('Αίγιο', 'Αίγιο', 'Peloponnese'), ('Κιάτο', 'Κιάτο', 'Peloponnese'),
    ('Ροδοδάφνη', 'Αίγιο', 'Peloponnese'), ('Ανδρίτσα', 'Αργολίδα', 'Peloponnese'),
    ('Ρίου', 'Πάτρα', 'Peloponnese'), ('Αχαϊα', 'Αχαΐα', 'Peloponnese'),
    # Northern Greece
    ('Θεσσαλονίκη', 'Θεσσαλονίκη', 'Northern Greece'), ('Θεσσαλονίκης', 'Θεσσαλονίκη', 'Northern Greece'),
    ('Κιλκίς', 'Κιλκίς', 'Northern Greece'), ('Μεταλλικό', 'Κιλκίς', 'Northern Greece'),
    ('Μεστή', 'Έβρος', 'Northern Greece'), ('Μάκρη', 'Έβρος', 'Northern Greece'),
    ('Δερβένι', 'Θεσσαλονίκη', 'Northern Greece'), ('Νυμφόπετρα', 'Θεσσαλονίκη', 'Northern Greece'),
    ('Αξιού', 'Θεσσαλονίκη', 'Northern Greece'), ('Φλώρινα', 'Φλώρινα', 'Northern Greece'),
    ('Ικονίου', 'Θεσσαλονίκη', 'Northern Greece'), ('ΙΩΑΝΝΙΝΩΝ', 'Ιωάννινα', 'Northern Greece'),
    ('Ιωαννίνων', 'Ιωάννινα', 'Northern Greece'),
    ('ΑΝΑΤΟΛΙΚΗΣ ΜΑΚΕΔΟΝΙΑΣ', 'Αν. Μακεδονία', 'Northern Greece'),
    # Thessaly
    ('Δομοκο', 'Δομοκός', 'Thessaly'), ('Λάρισα', 'Λάρισα', 'Thessaly'),
    ('Μουζακ', 'Μουζάκι', 'Thessaly'), ('Μεσοχώρα', 'Μεσοχώρα', 'Thessaly'),
    ('Ορφανών', 'Τρίκαλα', 'Thessaly'), ('Ενιπέα', 'Τρίκαλα', 'Thessaly'),
    ('Πορταικό', 'Τρίκαλα', 'Thessaly'), ('Τιθορέα', 'Φθιώτιδα', 'Thessaly'),
    ('Λιανοκλαδ', 'Λαμία', 'Thessaly'), ('Μαντούδι', 'Εύβοια', 'Central Greece'),
    ('Οινόη', 'Βοιωτία', 'Central Greece'),
    # Central Greece
    ('Χαλκίδ', 'Χαλκίδα', 'Central Greece'), ('ΧΑΛΚΙΔ', 'Χαλκίδα', 'Central Greece'),
    ('Αγρίνι', 'Αγρίνιο', 'Central Greece'), ('ΑΓΡΙΝΙ', 'Αγρίνιο', 'Central Greece'),
    ('Αιτωλοακαρνανία', 'Αιτωλοακαρρανία', 'Central Greece'),
    ('Ακαρνανικών', 'Αιτωλοακαρνανία', 'Central Greece'),
    ('Παραβόλα', 'Αγρίνιο', 'Central Greece'),
    ('ΒΟΝΙΤΣ', 'Αιτωλοακαρνανία', 'Central Greece'),
    ('Κεφαλλ', 'Κεφαλλονιά', 'Islands'), ('ΚΕΦΑΛΛΗΝΙΑ', 'Κεφαλλονιά', 'Islands'),
    ('Μεγαλόπολ', 'Μεγαλόπολη', 'Peloponnese'),
    # Abroad
    ('Iasi', 'Iasi, Ρουμανία', ''), ('Bucuresti', 'Βουκουρέστι, Ρουμανία', ''),
    ('Budapest', 'Βουδαπέστη, Ουγγαρία', ''),
    # Generic / fallback for certain clients
    ('Σταυροχώρι', 'Σταυροχώρι', 'Northern Greece'),
    ('COMEDEAST', 'Λάρισα', 'Thessaly'),
    ('Ποσειδώνος', 'Αθήνα', 'Attica'),
    ('Ιεράς οδού', 'Αθήνα', 'Attica'),
    ('Ποδονίφτη', 'Αθήνα', 'Attica'),
    ('Παραϊόνι', 'Αιτωλοακαρνανία', 'Central Greece'),
    ('Ανήλιου', 'Ιωάννινα', 'Northern Greece'),
    ('Μικρολίμανο', 'Πειραιάς', 'Attica'),
    ('MOTOR OIL', 'Κόρινθος', 'Peloponnese'),
    ('Ασπρόπυργ', 'Ασπρόπυργος', 'Attica'),
    ('Ρόμπολα', 'Κεφαλλονιά', 'Islands'),
    ('Αγρινίου', 'Αγρίνιο', 'Central Greece'),
    ('Αερολιμένα Χίου', 'Χίος', 'Islands'),
    ('ΑΕΡΟΛΙΜΕΝΑ ΧΙΟΥ', 'Χίος', 'Islands'),
    ('Μπότσαρη', 'Αθήνα', 'Attica'),
    ('ΕΛΛΗΝΙΚΟ', 'Ελληνικό', 'Attica'),
    ('ΑΘΗΝΑΙΩΝ', 'Αθήνα', 'Attica'),
    ('Αθηναίων', 'Αθήνα', 'Attica'),
    ('ΜΑΝΤΟΥΔΙ', 'Εύβοια', 'Central Greece'),
    ('Καφεπολείου', 'Αθήνα', 'Attica'),
    ('Υδροσυλλογής', 'Αθήνα', 'Attica'),
    ('Comedeast', 'Λάρισα', 'Thessaly'),
    ('Nicorita', 'Iasi, Ρουμανία', ''),
    ('DUDESTI', 'Βουκουρέστι, Ρουμανία', ''),
    ('Πιερία', 'Πιερία', 'Northern Greece'),
    ('Κατερίνη', 'Κατερίνη', 'Northern Greece'),
]


def extract_location(description, client):
    """Extract location and region from project description and client."""
    text = f"{description} {client}"
    for search, location, region in LOCATION_MAP:
        if search in text:
            return location, region
    return '', ''


def classify_typology(name, client):
    """Classify project typology from Greek name + client using keyword matching."""
    text = f"{name} {client}".lower()
    for typology, keywords in TYPOLOGY_RULES:
        for kw in keywords:
            if kw.lower() in text:
                return typology
    return 'Buildings'  # fallback


def parse_participation(val):
    """Normalize participation to a string like '100%' or '50%'."""
    if pd.isna(val):
        return ''
    val = str(val).strip()
    if not val:
        return ''
    # Handle "37,50%" format
    val = val.replace(',', '.')
    try:
        num = float(val)
        if num <= 1:
            return f"{num * 100:.0f}%"
        elif num <= 100:
            return f"{num:.0f}%"
        return str(val)
    except ValueError:
        return val


def parse_year(val):
    """Extract integer year from various formats."""
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        y = int(val)
        return y if 1900 <= y <= 2100 else None
    s = str(val).strip()
    m = re.search(r'(\d{4})', s)
    return int(m.group(1)) if m else None


def parse_status(end_val):
    """Determine status from end year column."""
    if pd.isna(end_val):
        return 'Completed'
    s = str(end_val).strip().lower()
    if 'εξέλιξη' in s or 'εξελιξη' in s:
        return 'In Progress'
    return 'Completed'


# ── Main ───────────────────────────────────────────────────
def main():
    if not os.path.exists(EXCEL_PATH):
        print(f"Excel file not found: {EXCEL_PATH}")
        sys.exit(1)

    # Read Excel (skip header row 0 which is the title)
    df = pd.read_excel(EXCEL_PATH, header=1)

    # Drop the summary row at the bottom
    df = df[df.iloc[:, 0] != 'ΣΥΝΟΛΟ ΕΚΤΕΛΕΣΘΕΝΤΩΝ ΕΡΓΩΝ']
    # Drop rows where project name is empty
    df = df.dropna(subset=[df.columns[1]])

    print(f"Read {len(df)} projects from Excel")

    # Ensure data directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Run schema creation (mirrors db.php)
    cur.execute('''CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_en TEXT DEFAULT "",
        description TEXT DEFAULT "",
        description_en TEXT DEFAULT "",
        year INTEGER NOT NULL,
        typology TEXT NOT NULL,
        location TEXT DEFAULT "",
        region TEXT DEFAULT "",
        architect TEXT DEFAULT "",
        size TEXT DEFAULT "",
        status TEXT DEFAULT "Completed",
        date_completed TEXT DEFAULT "",
        image_url TEXT DEFAULT "",
        images TEXT DEFAULT "[]",
        map_x REAL,
        map_y REAL,
        client TEXT DEFAULT "",
        contractor TEXT DEFAULT "",
        participation TEXT DEFAULT "",
        year_start INTEGER,
        budget REAL
    )''')

    # Add columns if missing (migration)
    cols = [row[1] for row in cur.execute("PRAGMA table_info(projects)").fetchall()]
    for col, typedef in [
        ('client', 'TEXT DEFAULT ""'),
        ('contractor', 'TEXT DEFAULT ""'),
        ('participation', 'TEXT DEFAULT ""'),
        ('year_start', 'INTEGER'),
        ('budget', 'REAL'),
        ('region', 'TEXT DEFAULT ""'),
        ('images', 'TEXT DEFAULT "[]"'),
        ('name_en', 'TEXT DEFAULT ""'),
        ('description_en', 'TEXT DEFAULT ""'),
    ]:
        if col not in cols:
            cur.execute(f'ALTER TABLE projects ADD COLUMN {col} {typedef}')

    # Clear existing projects
    old_count = cur.execute('SELECT COUNT(*) FROM projects').fetchone()[0]
    if old_count > 0:
        cur.execute('DELETE FROM projects')
        cur.execute("DELETE FROM sqlite_sequence WHERE name='projects'")
        print(f"Cleared {old_count} existing projects")

    # Insert projects
    typology_counts = {}
    insert_sql = '''INSERT INTO projects
        (name, description, year, typology, status, client, contractor, participation, year_start, budget, location, region)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'''

    locations_found = 0
    for _, row in df.iterrows():
        long_name = str(row.iloc[1]).strip()
        client = str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else ''
        contractor = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else ''
        participation = parse_participation(row.iloc[4])
        year_start = parse_year(row.iloc[5])
        year_end = parse_year(row.iloc[6])
        status = parse_status(row.iloc[6])
        budget = float(row.iloc[7]) if pd.notna(row.iloc[7]) else None

        typology = classify_typology(long_name, client)
        typology_counts[typology] = typology_counts.get(typology, 0) + 1

        # Short title for display, long name becomes description
        short_title = generate_short_title(long_name)
        description = long_name

        # Extract location from description + client
        location, region = extract_location(long_name, client)
        if location:
            locations_found += 1

        # Use end year if available, otherwise start year, otherwise 0
        year = year_end or year_start or 0

        cur.execute(insert_sql, (
            short_title, description, year, typology, status,
            client, contractor, participation, year_start, budget,
            location, region
        ))

    conn.commit()

    final_count = cur.execute('SELECT COUNT(*) FROM projects').fetchone()[0]
    print(f"\nImported {final_count} projects into {DB_PATH}")
    print(f"\nLocations extracted: {locations_found}/{final_count}")
    print("\nTypology classification:")
    for typ, count in sorted(typology_counts.items(), key=lambda x: -x[1]):
        print(f"  {typ}: {count}")

    # Export to projects-data.js
    export_projects_data(cur)

    conn.close()
    print("\nDone! Use the admin panel to review and enrich projects.")


def export_projects_data(cur):
    """Generate projects-data.js from database (mirrors export.php)."""
    rows = cur.execute('SELECT * FROM projects ORDER BY id').fetchall()
    col_names = [desc[0] for desc in cur.description]

    output = '/**\n * THEMELI \u2014 Projects Data\n * Edit via admin panel or directly in this file.\n */\nconst PROJECTS = [\n'

    for i, row in enumerate(rows):
        r = dict(zip(col_names, row))
        output += '  {\n'
        output += f'    id: {r["id"]},\n'
        output += f'    name: {json.dumps(r["name"], ensure_ascii=False)},\n'
        output += f'    name_en: {json.dumps(r.get("name_en") or "", ensure_ascii=False)},\n'
        output += f'    description: {json.dumps(r.get("description") or "", ensure_ascii=False)},\n'
        output += f'    description_en: {json.dumps(r.get("description_en") or "", ensure_ascii=False)},\n'
        output += f'    year: {r["year"]},\n'
        output += f'    typology: {json.dumps(r["typology"], ensure_ascii=False)},\n'
        output += f'    location: {json.dumps(r.get("location") or "", ensure_ascii=False)},\n'
        output += f'    region: {json.dumps(r.get("region") or "", ensure_ascii=False)},\n'
        output += f'    architect: {json.dumps(r.get("architect") or "", ensure_ascii=False)},\n'
        output += f'    size: {json.dumps(r.get("size") or "", ensure_ascii=False)},\n'
        output += f'    status: {json.dumps(r.get("status") or "", ensure_ascii=False)},\n'
        output += f'    dateCompleted: {json.dumps(r.get("date_completed") or "", ensure_ascii=False)},\n'
        output += f'    image: {json.dumps(r.get("image_url") or "", ensure_ascii=False)},\n'
        try:
            imgs = json.loads(r.get("images") or '[]')
        except (json.JSONDecodeError, TypeError):
            imgs = []
        output += f'    images: {json.dumps(imgs)},\n'
        output += f'    mapX: {float(r["map_x"]) if r.get("map_x") is not None else "null"},\n'
        output += f'    mapY: {float(r["map_y"]) if r.get("map_y") is not None else "null"},\n'
        output += f'    client: {json.dumps(r.get("client") or "", ensure_ascii=False)},\n'
        output += f'    contractor: {json.dumps(r.get("contractor") or "", ensure_ascii=False)},\n'
        output += f'    participation: {json.dumps(r.get("participation") or "", ensure_ascii=False)},\n'
        output += f'    yearStart: {int(r["year_start"]) if r.get("year_start") is not None else "null"},\n'
        output += f'    budget: {float(r["budget"]) if r.get("budget") is not None else "null"}\n'
        output += '  }' + (',' if i < len(rows) - 1 else '') + '\n'

    output += '];\n'

    for target in [
        os.path.join(PROJECT_ROOT, 'src', 'projects-data.js'),
        os.path.join(PROJECT_ROOT, 'dist', 'projects-data.js'),
    ]:
        target_dir = os.path.dirname(target)
        if os.path.isdir(target_dir):
            with open(target, 'w', encoding='utf-8') as f:
                f.write(output)
            print(f"Wrote {target}")


if __name__ == '__main__':
    main()
