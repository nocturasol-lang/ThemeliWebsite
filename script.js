/**
 * THEMELI — Monumental Brutalism interactions
 */

// ========== I18N ==========
const LANG = window.location.pathname.includes('/el/') ? 'el' : 'en';
const BASE = window.location.pathname.match(/\/(en|el)\//) ? '../' : '';

// Supabase client (read-only, uses anon key)
const _sb = (typeof SUPABASE_URL !== 'undefined' && typeof supabase !== 'undefined')
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Shared async fetch: Supabase → fallback to PROJECTS constant
async function fetchProjects() {
  if (_sb) {
    try {
      const { data, error } = await _sb.from('projects').select('*').order('id');
      if (!error && data) {
        return data.map(r => ({
          id: r.id, name: r.name, description: r.description || '',
          year: r.year, typology: r.typology, location: r.location || '',
          architect: r.architect || '', size: r.size || '',
          status: r.status || 'Completed', dateCompleted: r.date_completed || '',
          image: r.image_url || '', mapX: r.map_x, mapY: r.map_y
        }));
      }
    } catch (e) { /* fall through to local data */ }
  }
  return typeof PROJECTS !== 'undefined' ? PROJECTS : [];
}

const I18N = {
  en: {
    projects: 'Projects', project: 'Project',
    copied: 'Copied!', copyAddress: 'Copy Address', copyNumber: 'Copy Number',
    subsData: {
      themos: { name: 'themos', subtitle: 'concrete prefabrication', logo: BASE + 'assets/themos.svg', featured: [
        { name: 'Production Facility', year: '2005', tag: 'MANUFACTURING', img: BASE + 'assets/themos/aer01.jpg' },
        { name: 'Railway Sleepers', year: '', tag: 'PRODUCTION', img: BASE + 'assets/themos/IMG_2030.JPG.jpg' },
        { name: 'Concrete Poles', year: '2017', tag: 'EXPANSION', img: BASE + 'assets/themos/img_0478.jpg' },
        { name: 'Quality Control', year: '', tag: 'ISO 9000', img: BASE + 'assets/themos/phins7.jpg' }
      ], desc: '<p><strong>THE.MO.S. S.A.</strong> was established in 2005 as a subsidiary of <strong>THEMELI S.A.</strong> Its initial activity focused on the construction and operation of a manufacturing plant for railway sleepers (track sleepers) aimed at meeting the needs of the Greek railway network. The production facility is strategically located approximately 150 kilometers from Athens, near the city of Argos.</p><p>By April 2019, the company had produced significant quantities of railway sleepers:</p><ul><li><strong>120,000 TBS 1000 sleepers:</strong> Designed for metre-gauge track (1,000 mm), these sleepers have already been installed on the railway network of the Peloponnese.</li><li><strong>200,000 B-70 sleepers:</strong> Intended for standard-gauge track (1,435 mm), these have been installed across the wider Greek railway network.</li></ul><p>Production is carried out using a modern <strong>carousel system with the pre-tensioning method</strong>. The plant\'s current production capacity reaches <strong>3,000 sleepers per week</strong>, with the potential to expand to <strong>5,000 sleepers per week</strong> through the addition of curing chambers and molds.</p><h3>Expansion of Activities and New Product Lines</h3><p>In 2009, <strong>THE.MO.S. S.A.</strong> expanded its facilities with a new production unit for <strong>railway turnout sleepers</strong> at the same location. This <strong>long-line production unit</strong> has a daily capacity of <strong>160 meters</strong> and was commissioned with the technical expertise of <strong>Leonhard Moll Betonwerke GmbH &amp; Co. KG</strong>. The flexibility of the unit allows for the production of various sleeper types.</p><p>To date, the unit has produced <strong>16,000 B-93 safety sleepers</strong> for standard-gauge track (1,435 mm), which are currently used on the <strong>Kiato\u2013Aigio railway line</strong>.</p><p>In 2017, the company implemented an innovative modification to the turnout sleeper production unit, enabling the <strong>manufacture of centrifugally cast concrete poles</strong> without interrupting its main production activities. This production line currently supplies <strong>HEDNO (Hellenic Electricity Distribution Network Operator)</strong>. The facility can be adapted to produce poles of different specifications with the addition of new molds, and approximately <strong>5,000 poles</strong> have already been delivered to HEDNO.</p><h3>Quality Assurance and Traceability</h3><p>The company implements strict quality control procedures at every stage of the production process. The <strong>certified ISO 9000 quality management system</strong> precisely defines the execution of each activity, from production and quality control to testing, storage, and product dispatch.</p><p>In addition, a comprehensive <strong>traceability system</strong> is in place, allowing the production conditions of each individual sleeper or pole to be tracked even many years after manufacturing.</p>' },
      thermis: { name: 'thermis', subtitle: 'wind farms', logo: BASE + 'assets/thermis.svg', featuredGroups: [
        { title: 'Xirovouni Platanou S.A.', subtitle: '17 MW \u2014 Since 2013', items: [
          { name: 'Xirovouni Wind Farm', img: BASE + 'assets/thermis-xirovouni/100_6623.jpg' },
          { name: 'Ridge Turbines', img: BASE + 'assets/thermis-xirovouni/P2117238.jpg' }
        ], gallery: [
          BASE + 'assets/thermis-xirovouni/100_6623.jpg',
          BASE + 'assets/thermis-xirovouni/2012-07-26_20-47-42_HDR.jpg',
          BASE + 'assets/thermis-xirovouni/DSC01841.jpg',
          BASE + 'assets/thermis-xirovouni/DSC01847.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_1719.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_2764.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3759.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3831.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3831 1.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3873.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3875.jpg',
          BASE + 'assets/thermis-xirovouni/P2117238.jpg',
          BASE + 'assets/thermis-xirovouni/P2157262.jpg',
          BASE + 'assets/thermis-xirovouni/P3117320.jpg',
          BASE + 'assets/thermis-xirovouni/P3167328.jpg',
          BASE + 'assets/thermis-xirovouni/100_6623.jpg',
          BASE + 'assets/thermis-xirovouni/P6146373.jpg',
          BASE + 'assets/thermis-xirovouni/P6146375.jpg',
          BASE + 'assets/thermis-xirovouni/P6187637.jpg',
          BASE + 'assets/thermis-xirovouni/P7046577.jpg',
          BASE + 'assets/thermis-xirovouni/P8136746.jpg'
        ]},
        { title: 'Perganti Akarnanikon S.A.', subtitle: '41.8 MW \u2014 Since 2020', items: [
          { name: 'Perganti Wind Farm', img: BASE + 'assets/thermis-perganti/IMG_20181116_083825.jpg' },
          { name: 'Mountain Turbines', img: BASE + 'assets/thermis-perganti/20190121_120435.jpg' }
        ], gallery: [
          BASE + 'assets/thermis-perganti/20181106_135323.jpg',
          BASE + 'assets/thermis-perganti/IMG_20181116_083825.jpg',
          BASE + 'assets/thermis-perganti/20190121_120435.jpg',
          BASE + 'assets/thermis-perganti/20200625_151739.jpg',
          BASE + 'assets/thermis-perganti/DSC_0002.jpg',
          BASE + 'assets/thermis-perganti/DSC_0011.jpg',
          BASE + 'assets/thermis-perganti/DSC_0020.jpg',
          BASE + 'assets/thermis-perganti/IMG_0488.jpg',
          BASE + 'assets/thermis-perganti/IMG_20180821_192307936.jpg',
          BASE + 'assets/thermis-perganti/IMG_20180901_141626488.jpg',
          BASE + 'assets/thermis-perganti/IMG_20181116_083825.jpg',
          BASE + 'assets/thermis-perganti/IMG_20181211_084738.jpg',
          BASE + 'assets/thermis-perganti/IMG_3843_mod.jpg'
        ]}
      ], desc: '<p>The <strong>THEMELI S.A. Group</strong>, guided by its long-standing commitment to innovation and the pioneering application of modern technologies, has dynamically expanded in recent decades into the sector of <strong>Renewable Energy Sources (RES)</strong> and <strong>green development</strong> through the establishment of <strong>THERMIS S.A.</strong></p><p>Today, the company has successfully completed the construction and full operation of two major <strong>wind farms</strong> located at <strong>Xirovouni in the Municipality of Nafpaktia</strong> and <strong>Perganti in the Municipality of Aktio\u2013Vonitsa</strong>, both in the <strong>Aitoloakarnania region of Greece</strong>.</p><p>These two wind farms operate under the umbrella of two dedicated companies:</p><p style="text-align:center"><strong>Xirovouni Platanou S.A.</strong> and <strong>Perganti Akarnanikon S.A.</strong>, respectively.</p><div class="sub-desc-columns"><div class="sub-desc-col"><h3>XIROVOUNI PLATANOU S.A.</h3><p>The <strong>Xirovouni Wind Farm</strong> has a total <strong>installed capacity of 17 MW</strong>. It is located at the site \u201cXirovouni,\u201d within the <strong>Platanos Municipal Unit of the Municipality of Nafpaktia</strong>, in the <strong>Regional Unit of Aitoloakarnania</strong>.</p><p>The wind farm has been in operation since <strong>2013</strong>, managed by <strong>Xirovouni Platanou S.A.</strong> Its facilities extend along the ridge of Mount Xirovouni, an area characterized by <strong>high wind potential</strong>, making it particularly suitable for wind energy production.</p></div><div class="sub-desc-divider"></div><div class="sub-desc-col"><h3>PERGANTI AKARNANIKON S.A.</h3><p>In <strong>2020</strong>, the <strong>Perganti Wind Farm</strong>, operated by <strong>Perganti Akarnanikon S.A.</strong>, commenced its operations with a total <strong>installed capacity of 41.8 MW</strong>.</p><p>The wind farm is located in the <strong>Perganti area of Vonitsa</strong>, in the <strong>Aitoloakarnania region of Greece</strong>, and aims to harness the <strong>wind potential of the Akarnanian Mountains</strong> for the production of renewable electrical energy.</p></div></div>' },
      tetrapolis: { name: 'tetrapolis', subtitle: 'real estate management', logo: BASE + 'assets/tetrapolis.svg', featured: [
        { name: 'Property Overview', img: BASE + 'assets/tetrapolis/Screenshot_2021-10-11_at_12.48.32_PM.jpg' },
        { name: 'Kea Residence', img: BASE + 'assets/tetrapolis/Eris_Retreat_in_Kea-47.jpg' },
        { name: 'Pool View', img: BASE + 'assets/tetrapolis/Eris_Retreat_in_Kea-72.jpg' },
        { name: 'Aerial View', img: BASE + 'assets/tetrapolis/IMG_4909.jpeg' }
      ], desc: '<p>This modern <strong>Private Capital Company (IKE) specializing in real estate management</strong> represents one of the <strong>most recent initiatives of the THEMELI S.A. Group</strong>.</p><p>Its objective is to offer <strong>premium real estate properties</strong> while expanding the Group\'s presence in the <strong>rapidly growing sector of high-end short-term rental accommodations</strong>.</p><p>The company\'s <strong>property portfolio</strong> includes carefully selected assets, ranging from boutique residential complexes in Kea to cosmopolitan penthouses in Athens and Voula, as well as traditional mansions in Paros and Pelion:</p><ul><li><strong>Kea:</strong> Boutique residential complex with a swimming pool.</li><li><strong>Paros:</strong> Seafront villa with views of the Aegean Sea.</li><li><strong>Voula:</strong> Urban penthouse with a private pool.</li><li><strong>Athens:</strong> Modern apartments with views of the Acropolis.</li><li><strong>Pelion:</strong> Seaside traditional mansion.</li></ul>' }
    }
  },
  el: {
    projects: 'Έργα', project: 'Έργο',
    copied: 'Αντιγράφηκε!', copyAddress: 'Αντιγραφή Διεύθυνσης', copyNumber: 'Αντιγραφή Αριθμού',
    subsData: {
      themos: { name: 'themos', subtitle: 'προκατασκευές σκυροδέματος', logo: BASE + 'assets/themos.svg', featured: [
        { name: 'Εγκαταστάσεις Παραγωγής', img: BASE + 'assets/themos/aer01.jpg' },
        { name: 'Σιδηροδρομικοί Στρωτήρες', img: BASE + 'assets/themos/IMG_2030.JPG.jpg' },
        { name: 'Στύλοι Σκυροδέματος', img: BASE + 'assets/themos/img_0478.jpg' },
        { name: 'Ποιοτικός Έλεγχος', img: BASE + 'assets/themos/phins7.jpg' }
      ], desc: '<p>Η <strong>ΘΕ.ΜΟ.Σ. Α.Ε.</strong> ιδρύθηκε το 2005 ως θυγατρική της <strong>ΘΕΜΕΛΗ Α.Ε.</strong> Η αρχική της δραστηριότητα επικεντρώθηκε στην κατασκευή και λειτουργία μονάδας παραγωγής σιδηροδρομικών στρωτήρων με στόχο την κάλυψη των αναγκών του ελληνικού σιδηροδρομικού δικτύου. Η μονάδα παραγωγής βρίσκεται στρατηγικά σε απόσταση περίπου 150 χιλιομέτρων από την Αθήνα, κοντά στην πόλη του Άργους.</p><p>Μέχρι τον Απρίλιο του 2019, η εταιρεία είχε παράγει σημαντικές ποσότητες σιδηροδρομικών στρωτήρων:</p><ul><li><strong>120.000 στρωτήρες TBS 1000:</strong> Σχεδιασμένοι για μετρική γραμμή (1.000 mm), έχουν ήδη τοποθετηθεί στο σιδηροδρομικό δίκτυο της Πελοποννήσου.</li><li><strong>200.000 στρωτήρες B-70:</strong> Προορισμένοι για κανονική γραμμή (1.435 mm), έχουν τοποθετηθεί στο ευρύτερο ελληνικό σιδηροδρομικό δίκτυο.</li></ul><p>Η παραγωγή πραγματοποιείται με σύγχρονο <strong>σύστημα carousel με τη μέθοδο προέντασης</strong>. Η τρέχουσα παραγωγική δυναμικότητα φτάνει τους <strong>3.000 στρωτήρες την εβδομάδα</strong>, με δυνατότητα επέκτασης στους <strong>5.000 στρωτήρες την εβδομάδα</strong> με την προσθήκη θαλάμων ωρίμανσης και καλουπιών.</p><h3>Επέκταση Δραστηριοτήτων και Νέες Γραμμές Προϊόντων</h3><p>Το 2009, η <strong>ΘΕ.ΜΟ.Σ. Α.Ε.</strong> επέκτεινε τις εγκαταστάσεις της με νέα μονάδα παραγωγής <strong>στρωτήρων αλλαγής τροχιάς</strong> στην ίδια τοποθεσία. Αυτή η <strong>μονάδα παραγωγής μακράς γραμμής</strong> έχει ημερήσια δυναμικότητα <strong>160 μέτρων</strong> και τέθηκε σε λειτουργία με την τεχνογνωσία της <strong>Leonhard Moll Betonwerke GmbH &amp; Co. KG</strong>.</p><p>Μέχρι σήμερα, η μονάδα έχει παράγει <strong>16.000 στρωτήρες ασφαλείας B-93</strong> για κανονική γραμμή (1.435 mm), που χρησιμοποιούνται στη <strong>σιδηροδρομική γραμμή Κιάτο\u2013Αίγιο</strong>.</p><p>Το 2017, η εταιρεία υλοποίησε καινοτόμο τροποποίηση της μονάδας, επιτρέποντας την <strong>παραγωγή φυγοκεντρικών στύλων σκυροδέματος</strong>. Η γραμμή παραγωγής τροφοδοτεί σήμερα τον <strong>ΔΕΔΔΗΕ</strong>. Περίπου <strong>5.000 στύλοι</strong> έχουν ήδη παραδοθεί.</p><h3>Διασφάλιση Ποιότητας και Ιχνηλασιμότητα</h3><p>Η εταιρεία εφαρμόζει αυστηρές διαδικασίες ποιοτικού ελέγχου σε κάθε στάδιο παραγωγής. Το <strong>πιστοποιημένο σύστημα διαχείρισης ποιότητας ISO 9000</strong> καθορίζει επακριβώς την εκτέλεση κάθε δραστηριότητας.</p><p>Επιπλέον, λειτουργεί ολοκληρωμένο <strong>σύστημα ιχνηλασιμότητας</strong>, που επιτρέπει τον εντοπισμό των συνθηκών παραγωγής κάθε στρωτήρα ή στύλου ακόμα και πολλά χρόνια μετά την κατασκευή.</p>' },
      thermis: { name: 'thermis', subtitle: 'αιολικά πάρκα', logo: BASE + 'assets/thermis.svg', featuredGroups: [
        { title: 'Ξηροβούνι Πλατάνου Α.Ε.', subtitle: '17 MW \u2014 Από το 2013', items: [
          { name: 'Αιολικό Πάρκο Ξηροβούνι', img: BASE + 'assets/thermis-xirovouni/100_6623.jpg' },
          { name: 'Ανεμογεννήτριες Κορυφογραμμής', img: BASE + 'assets/thermis-xirovouni/P2117238.jpg' }
        ], gallery: [
          BASE + 'assets/thermis-xirovouni/100_6623.jpg',
          BASE + 'assets/thermis-xirovouni/2012-07-26_20-47-42_HDR.jpg',
          BASE + 'assets/thermis-xirovouni/DSC01841.jpg',
          BASE + 'assets/thermis-xirovouni/DSC01847.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_1719.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_2764.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3759.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3831.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3831 1.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3873.jpg',
          BASE + 'assets/thermis-xirovouni/IMG_3875.jpg',
          BASE + 'assets/thermis-xirovouni/P2117238.jpg',
          BASE + 'assets/thermis-xirovouni/P2157262.jpg',
          BASE + 'assets/thermis-xirovouni/P3117320.jpg',
          BASE + 'assets/thermis-xirovouni/P3167328.jpg',
          BASE + 'assets/thermis-xirovouni/100_6623.jpg',
          BASE + 'assets/thermis-xirovouni/P6146373.jpg',
          BASE + 'assets/thermis-xirovouni/P6146375.jpg',
          BASE + 'assets/thermis-xirovouni/P6187637.jpg',
          BASE + 'assets/thermis-xirovouni/P7046577.jpg',
          BASE + 'assets/thermis-xirovouni/P8136746.jpg'
        ]},
        { title: 'Περγαντί Ακαρνανικών Α.Ε.', subtitle: '41,8 MW \u2014 Από το 2020', items: [
          { name: 'Αιολικό Πάρκο Περγαντί', img: BASE + 'assets/thermis-perganti/IMG_20181116_083825.jpg' },
          { name: 'Ανεμογεννήτριες Βουνού', img: BASE + 'assets/thermis-perganti/20190121_120435.jpg' }
        ], gallery: [
          BASE + 'assets/thermis-perganti/20181106_135323.jpg',
          BASE + 'assets/thermis-perganti/IMG_20181116_083825.jpg',
          BASE + 'assets/thermis-perganti/20190121_120435.jpg',
          BASE + 'assets/thermis-perganti/20200625_151739.jpg',
          BASE + 'assets/thermis-perganti/DSC_0002.jpg',
          BASE + 'assets/thermis-perganti/DSC_0011.jpg',
          BASE + 'assets/thermis-perganti/DSC_0020.jpg',
          BASE + 'assets/thermis-perganti/IMG_0488.jpg',
          BASE + 'assets/thermis-perganti/IMG_20180821_192307936.jpg',
          BASE + 'assets/thermis-perganti/IMG_20180901_141626488.jpg',
          BASE + 'assets/thermis-perganti/IMG_20181116_083825.jpg',
          BASE + 'assets/thermis-perganti/IMG_20181211_084738.jpg',
          BASE + 'assets/thermis-perganti/IMG_3843_mod.jpg'
        ]}
      ], desc: '<p>Ο <strong>Όμιλος ΘΕΜΕΛΗ Α.Ε.</strong>, καθοδηγούμενος από τη μακρόχρονη δέσμευσή του στην καινοτομία και την πρωτοποριακή εφαρμογή σύγχρονων τεχνολογιών, έχει επεκταθεί δυναμικά τις τελευταίες δεκαετίες στον τομέα των <strong>Ανανεώσιμων Πηγών Ενέργειας (ΑΠΕ)</strong> και της <strong>πράσινης ανάπτυξης</strong> μέσω της ίδρυσης της <strong>ΘΕΡΜΙΣ Α.Ε.</strong></p><p>Σήμερα, η εταιρεία έχει ολοκληρώσει επιτυχώς την κατασκευή και πλήρη λειτουργία δύο μεγάλων <strong>αιολικών πάρκων</strong> στο <strong>Ξηροβούνι του Δήμου Ναυπακτίας</strong> και στο <strong>Περγαντί του Δήμου Ακτίου\u2013Βόνιτσας</strong>, και τα δύο στην <strong>Αιτωλοακαρνανία</strong>.</p><p>Τα δύο αιολικά πάρκα λειτουργούν υπό την ομπρέλα δύο εταιρειών ειδικού σκοπού:</p><p style="text-align:center"><strong>Ξηροβούνι Πλατάνου Α.Ε.</strong> και <strong>Περγαντί Ακαρνανικών Α.Ε.</strong>, αντίστοιχα.</p><div class="sub-desc-columns"><div class="sub-desc-col"><h3>ΞΗΡΟΒΟΥΝΙ ΠΛΑΤΑΝΟΥ Α.Ε.</h3><p>Το <strong>Αιολικό Πάρκο Ξηροβούνι</strong> έχει συνολική <strong>εγκατεστημένη ισχύ 17 MW</strong>. Βρίσκεται στη θέση \u00ABΞηροβούνι\u00BB, εντός της <strong>Δημοτικής Ενότητας Πλατάνου του Δήμου Ναυπακτίας</strong>, στην <strong>Αιτωλοακαρνανία</strong>.</p><p>Το αιολικό πάρκο λειτουργεί από το <strong>2013</strong>, διαχειριζόμενο από την <strong>Ξηροβούνι Πλατάνου Α.Ε.</strong> Οι εγκαταστάσεις του εκτείνονται κατά μήκος της κορυφογραμμής του όρους Ξηροβούνι, περιοχή με <strong>υψηλό αιολικό δυναμικό</strong>.</p></div><div class="sub-desc-divider"></div><div class="sub-desc-col"><h3>ΠΕΡΓΑΝΤΙ ΑΚΑΡΝΑΝΙΚΩΝ Α.Ε.</h3><p>Το <strong>2020</strong>, το <strong>Αιολικό Πάρκο Περγαντί</strong>, που λειτουργεί από την <strong>Περγαντί Ακαρνανικών Α.Ε.</strong>, ξεκίνησε τη λειτουργία του με συνολική <strong>εγκατεστημένη ισχύ 41,8 MW</strong>.</p><p>Το αιολικό πάρκο βρίσκεται στην <strong>περιοχή Περγαντί της Βόνιτσας</strong>, στην <strong>Αιτωλοακαρνανία</strong>, και στοχεύει στην αξιοποίηση του <strong>αιολικού δυναμικού των Ακαρνανικών Ορέων</strong> για την παραγωγή ανανεώσιμης ηλεκτρικής ενέργειας.</p></div></div>' },
      tetrapolis: { name: 'tetrapolis', subtitle: 'διαχείριση ακινήτων', logo: BASE + 'assets/tetrapolis.svg', featured: [
        { name: 'Επισκόπηση Ακινήτων', img: BASE + 'assets/tetrapolis/Screenshot_2021-10-11_at_12.48.32_PM.jpg' },
        { name: 'Κατοικία Κέας', img: BASE + 'assets/tetrapolis/Eris_Retreat_in_Kea-47.jpg' },
        { name: 'Θέα Πισίνας', img: BASE + 'assets/tetrapolis/Eris_Retreat_in_Kea-72.jpg' },
        { name: 'Αεροφωτογραφία', img: BASE + 'assets/tetrapolis/IMG_4909.jpeg' }
      ], desc: '<p>Αυτή η σύγχρονη <strong>Ιδιωτική Κεφαλαιουχική Εταιρεία (ΙΚΕ) ειδικευμένη στη διαχείριση ακινήτων</strong> αποτελεί μία από τις <strong>πιο πρόσφατες πρωτοβουλίες του Ομίλου ΘΕΜΕΛΗ Α.Ε.</strong></p><p>Στόχος της είναι η προσφορά <strong>premium ακινήτων</strong> διευρύνοντας παράλληλα την παρουσία του Ομίλου στον <strong>ταχέως αναπτυσσόμενο τομέα των υψηλών βραχυχρόνιων μισθώσεων</strong>.</p><p>Το <strong>χαρτοφυλάκιο ακινήτων</strong> της εταιρείας περιλαμβάνει προσεκτικά επιλεγμένα ακίνητα, από boutique συγκροτήματα κατοικιών στην Κέα έως κοσμοπολίτικα ρετιρέ στην Αθήνα και τη Βούλα, καθώς και παραδοσιακά αρχοντικά στην Πάρο και το Πήλιο:</p><ul><li><strong>Κέα:</strong> Boutique συγκρότημα κατοικιών με πισίνα.</li><li><strong>Πάρος:</strong> Παραθαλάσσια βίλα με θέα στο Αιγαίο.</li><li><strong>Βούλα:</strong> Αστικό ρετιρέ με ιδιωτική πισίνα.</li><li><strong>Αθήνα:</strong> Σύγχρονα διαμερίσματα με θέα στην Ακρόπολη.</li><li><strong>Πήλιο:</strong> Παραθαλάσσιο παραδοσιακό αρχοντικό.</li></ul>' }
    }
  }
};
const T = I18N[LANG];

// Language switcher
const langSwitch = document.querySelector('[data-lang-switch]');
if (langSwitch) {
  const otherLang = LANG === 'en' ? 'el' : 'en';
  const currentPath = window.location.pathname;
  const newPath = currentPath.replace('/' + LANG + '/', '/' + otherLang + '/');
  langSwitch.href = newPath + window.location.search;
}

// ========== MENU ==========
const hamburger = document.getElementById('hamburger');
const navOverlay = document.getElementById('navOverlay');

if (hamburger && navOverlay) {
  hamburger.addEventListener('click', () => {
    const isOpening = !navOverlay.classList.contains('is-open');
    hamburger.classList.toggle('is-active');
    navOverlay.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', isOpening);
    document.body.style.overflow = isOpening ? 'hidden' : '';
  });

  navOverlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('is-active');
      navOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOverlay.classList.contains('is-open')) {
      hamburger.classList.remove('is-active');
      navOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
}

// ========== PAGE HEADER SCROLL FADE ==========
const pageHeader = document.querySelector('.page-header');
if (pageHeader) {
  let phTicking = false;
  let phLastScrollY = 0;
  window.addEventListener('scroll', () => {
    if (!phTicking) {
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY <= 80) {
          pageHeader.classList.remove('is-hidden');
        } else if (currentY < phLastScrollY) {
          pageHeader.classList.remove('is-hidden');
        } else {
          pageHeader.classList.add('is-hidden');
        }
        phLastScrollY = currentY;
        phTicking = false;
      });
      phTicking = true;
    }
  }, { passive: true });
}

// ========== SCROLL REVEAL ==========
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -60px 0px'
});

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .timeline-bar').forEach(el => {
  revealObserver.observe(el);
});

// ========== TYPEWRITER EFFECT ==========
document.querySelectorAll('.timeline-opener').forEach(el => {
  const origHTML = el.innerHTML;
  el.classList.add('typewriter');

  // Parse original HTML into a temp container
  const temp = document.createElement('div');
  temp.innerHTML = origHTML;

  const walkAndWrap = (node) => {
    const frag = document.createDocumentFragment();
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split('').forEach(ch => {
          const span = document.createElement('span');
          span.className = 'tw-char';
          span.textContent = ch;
          frag.appendChild(span);
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = child.cloneNode(false);
        clone.appendChild(walkAndWrap(child));
        frag.appendChild(clone);
      }
    });
    return frag;
  };

  el.innerHTML = '';
  el.appendChild(walkAndWrap(temp));

  // Gather all tw-char spans in order
  const chars = el.querySelectorAll('.tw-char');

  // Observe for scroll reveal
  const twObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        twObserver.unobserve(el);
        el.classList.add('typing');
        let i = 0;
        const speed = 14; // ms per batch
        const batchSize = 2; // reveal 2 chars per tick
        const tick = () => {
          if (i < chars.length) {
            for (let b = 0; b < batchSize && i < chars.length; b++, i++) {
              chars[i].classList.add('tw-visible');
            }
            requestAnimationFrame(() => setTimeout(tick, speed));
          }
        };
        tick();
      }
    });
  }, { threshold: 0.1 });

  twObserver.observe(el);
});

// ========== SCROLL TO TOP ==========
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  let stTicking = false;
  window.addEventListener('scroll', () => {
    if (!stTicking) {
      requestAnimationFrame(() => {
        scrollTopBtn.classList.toggle('is-visible', window.scrollY > 300);
        stTicking = false;
      });
      stTicking = true;
    }
  });
}

// ========== SMOOTH PARALLAX ON HERO ==========
const hero = document.querySelector('.hero');
const heroEst = document.querySelector('.hero-est');

if (hero && heroEst) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        if (scrollY < heroHeight) {
          const progress = scrollY / heroHeight;
          heroEst.style.transform = `translateY(calc(-50% + ${scrollY * 0.3}px))`;
          heroEst.style.opacity = 1 - progress * 1.5;
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// ========== TIMELINE NAV ==========
const timelineNav = document.getElementById('timelineNav');
if (timelineNav) {
  const navButtons = timelineNav.querySelectorAll('.timeline-nav-year');
  const progressBar = document.getElementById('timelineNavProgress');

  // Click to scroll
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (target) {
        const offset = 120;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Track active era on scroll
  const eraIds = Array.from(navButtons).map(btn => btn.getAttribute('data-target'));
  const eraElements = eraIds.map(id => document.getElementById(id)).filter(Boolean);

  function updateActiveYear() {
    const scrollY = window.scrollY + 200;
    let activeIndex = 0;

    eraElements.forEach((el, i) => {
      if (el.offsetTop <= scrollY) {
        activeIndex = i;
      }
    });

    navButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === activeIndex);
    });

    // Update progress bar
    if (progressBar && navButtons.length > 1) {
      const pct = (activeIndex / (navButtons.length - 1)) * 100;
      progressBar.style.width = pct + '%';
    }
  }

  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(() => {
        updateActiveYear();
        navTicking = false;
      });
      navTicking = true;
    }
  });

  updateActiveYear();
}

// ========== PROJECTS: DATA-DRIVEN RENDERING ==========
const projGridView = document.getElementById('projGridView');
const projListView = document.getElementById('projListView');
const projMapView = document.getElementById('projMapView');
const mapInner = document.getElementById('mapInner');

// Load projects from Supabase (async) with PROJECTS fallback
if (projGridView) {
(async function renderProjects() {
const projectData = await fetchProjects();
if (!projectData.length) return;
  // Escape HTML entities
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Render grid cards
  projectData.forEach(p => {
    const imgStyle = p.image ? ` style="background-image:url('${esc(p.image)}')"` : '';
    projGridView.insertAdjacentHTML('beforeend',
      `<a class="proj-card" data-typology="${esc(p.typology)}" href="project.html#${p.id}">
        <div class="proj-card-img"${imgStyle}></div>
        <div class="proj-card-info"><span class="proj-card-name">${esc(p.name)}</span><span class="proj-card-year">${p.year}</span></div>
        <span class="proj-card-tag">${esc(p.typology)}</span>
      </a>`
    );
  });

  // Render list rows
  if (projListView) {
    projectData.forEach(p => {
      projListView.insertAdjacentHTML('beforeend',
        `<a class="proj-row" data-typology="${esc(p.typology)}" href="project.html#${p.id}"><span class="proj-col proj-col-name">${esc(p.name)}</span><span class="proj-col proj-col-type">${esc(p.typology)}</span><span class="proj-col proj-col-loc">${esc(p.location)}</span><span class="proj-col proj-col-year">${p.year}</span></a>`
      );
    });
  }

  // Render map dots with tooltip cards
  if (mapInner) {
    projectData.forEach(p => {
      if (p.mapX == null || p.mapY == null) return;
      const tooltipImg = p.image ? ` style="background-image:url('${esc(p.image)}')"` : '';
      mapInner.insertAdjacentHTML('beforeend',
        `<a class="proj-map-dot" style="left:${p.mapX}%;top:${p.mapY}%" data-typology="${esc(p.typology)}" href="project.html#${p.id}">
          <div class="proj-map-tooltip">
            <div class="proj-map-tooltip-img"${tooltipImg}></div>
            <div class="proj-map-tooltip-body">
              <span class="proj-map-tooltip-name">${esc(p.name)}</span>
              <span class="proj-map-tooltip-year">${p.year}</span>
            </div>
            <span class="proj-map-tooltip-tag">${esc(p.typology)}</span>
          </div>
        </a>`
      );
    });
  }

  // Update initial count
  const projCount = document.getElementById('projCount');
  if (projCount) {
    projCount.textContent = projectData.length + ' ' + (projectData.length !== 1 ? T.projects : T.project);
  }
})();
}

// ========== PROJECTS VIEW SWITCHING ==========
const projViewToggles = document.getElementById('projViewToggles');

if (projViewToggles && projGridView) {
  const viewBtns = projViewToggles.querySelectorAll('.proj-view-btn');
  const views = { grid: projGridView, list: projListView, map: projMapView };

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      viewBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      Object.entries(views).forEach(([key, el]) => {
        if (el) el.style.display = key === target ? '' : 'none';
      });
    });
  });
}

// ========== MAP ZOOM & PAN ==========
const mapViewport = document.getElementById('mapViewport');
const mapZoomIn = document.getElementById('mapZoomIn');
const mapZoomOut = document.getElementById('mapZoomOut');

if (mapViewport && mapInner) {
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function applyTransform(smooth) {
    mapInner.style.transition = smooth ? 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    mapInner.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    mapViewport.classList.toggle('is-zoomed', scale > 1);
  }

  function clampPan() {
    if (scale <= 1) { panX = 0; panY = 0; return; }
    const rect = mapViewport.getBoundingClientRect();
    const maxPan = (rect.width * (scale - 1)) / 2;
    panX = Math.max(-maxPan, Math.min(maxPan, panX));
    panY = Math.max(-maxPan, Math.min(maxPan, panY));
  }

  mapZoomIn.addEventListener('click', () => {
    if (scale < 2) { scale = 2; clampPan(); applyTransform(true); }
  });

  mapZoomOut.addEventListener('click', () => {
    scale = 1; panX = 0; panY = 0; applyTransform(true);
  });

  mapViewport.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    clampPan();
    applyTransform(false);
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  mapViewport.addEventListener('touchstart', (e) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    isDragging = true;
    startX = e.touches[0].clientX - panX;
    startY = e.touches[0].clientY - panY;
  }, { passive: true });

  mapViewport.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    panX = e.touches[0].clientX - startX;
    panY = e.touches[0].clientY - startY;
    clampPan();
    applyTransform(false);
    e.preventDefault();
  }, { passive: false });

  mapViewport.addEventListener('touchend', () => { isDragging = false; });

  mapViewport.addEventListener('dblclick', (e) => {
    if (scale > 1) {
      scale = 1; panX = 0; panY = 0;
    } else {
      scale = 2;
      const rect = mapViewport.getBoundingClientRect();
      panX = -(e.clientX - rect.left - rect.width / 2);
      panY = -(e.clientY - rect.top - rect.height / 2);
      clampPan();
    }
    applyTransform(true);
  });
}

// ========== PROJECTS FILTER (event delegation) ==========
const projFilterToggle = document.getElementById('projFilterToggle');
const projFilters = document.getElementById('projFilters');

if (projFilterToggle && projFilters) {
  projFilterToggle.addEventListener('click', () => {
    projFilters.classList.toggle('is-open');
    projFilterToggle.classList.toggle('is-active');
  });

  projFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.proj-filter-btn');
    if (!btn) return;

    projFilters.querySelectorAll('.proj-filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    const filter = btn.getAttribute('data-filter');
    let visibleCount = 0;

    // Filter all three views using event delegation
    document.querySelectorAll('.proj-row:not(.proj-row-header)').forEach(row => {
      const match = filter === 'all' || row.getAttribute('data-typology') === filter;
      row.classList.toggle('is-hidden', !match);
      if (match) visibleCount++;
    });

    document.querySelectorAll('.proj-card').forEach(card => {
      card.classList.toggle('is-hidden', filter !== 'all' && card.getAttribute('data-typology') !== filter);
    });

    document.querySelectorAll('.proj-map-dot').forEach(dot => {
      dot.classList.toggle('is-hidden', filter !== 'all' && dot.getAttribute('data-typology') !== filter);
    });

    const projCount = document.getElementById('projCount');
    if (projCount) {
      projCount.textContent = visibleCount + ' ' + (visibleCount !== 1 ? T.projects : T.project);
    }
  });
}

// ========== SUBSIDIARIES REACTIVE DETAIL ==========
const subsData = T.subsData;

const subsGrid = document.getElementById('subsGrid');
const subDetail = document.getElementById('subDetail');
const subBack = document.getElementById('subBack');
const subName = document.getElementById('subName');
const subSubtitle = document.getElementById('subSubtitle');
const subDesc = document.getElementById('subDesc');
const subLogo = document.getElementById('subLogo');

if (subsGrid && subDetail) {

  // Gallery lightbox function
  const openGallery = (images, startIndex) => {
    let idx = startIndex || 0;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-arrow lightbox-prev" aria-label="Previous">&lsaquo;</button>
      <img class="lightbox-img" src="${images[idx]}" alt="">
      <button class="lightbox-arrow lightbox-next" aria-label="Next">&rsaquo;</button>
      <div class="lightbox-counter">${idx + 1} / ${images.length}</div>`;
    document.body.appendChild(lb);

    const img = lb.querySelector('.lightbox-img');
    const counter = lb.querySelector('.lightbox-counter');
    const updateArrows = () => {
      lb.querySelector('.lightbox-prev').style.visibility = images.length > 1 ? 'visible' : 'hidden';
      lb.querySelector('.lightbox-next').style.visibility = images.length > 1 ? 'visible' : 'hidden';
    };
    const show = () => {
      img.src = images[idx];
      counter.textContent = (idx + 1) + ' / ' + images.length;
    };
    updateArrows();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => lb.classList.add('is-visible'));
    });

    const close = () => {
      lb.classList.remove('is-visible');
      setTimeout(() => lb.remove(), 300);
    };
    lb.querySelector('.lightbox-close').addEventListener('click', close);
    lb.querySelector('.lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      idx = (idx - 1 + images.length) % images.length;
      show();
    });
    lb.querySelector('.lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      idx = (idx + 1) % images.length;
      show();
    });
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
      if (e.key === 'ArrowLeft') { idx = (idx - 1 + images.length) % images.length; show(); }
      if (e.key === 'ArrowRight') { idx = (idx + 1) % images.length; show(); }
    });
  };

  // Show subsidiary detail view
  function showSubDetail(key, pushHistory) {
    const data = subsData[key];
    if (!data) return;

    subName.textContent = data.name;
    subSubtitle.textContent = data.subtitle;
    subDesc.innerHTML = data.desc;
    subLogo.setAttribute('data-sub', key);
    subLogo.innerHTML = `<img src="${data.logo}" alt="${data.name}">`;

    // Populate featured grid
    const subFeatured = document.getElementById('subFeatured');
    if (subFeatured) {
      const renderCard = (f) => {
        const hasImg = f.img && f.img !== '';
        const imgTag = hasImg
          ? `<img class="sub-featured-img" src="${f.img}" alt="${f.name}">`
          : `<div class="sub-featured-img sub-featured-img--empty"></div>`;
        return `<div class="sub-featured-card"${hasImg ? ` data-lightbox="${f.img}"` : ''}>
          ${imgTag}
          <div class="sub-featured-info">
            <span class="sub-featured-name">${f.name}</span>
          </div>
        </div>`;
      };

      if (data.featuredGroups && data.featuredGroups.length) {
        subFeatured.innerHTML = data.featuredGroups.map((group, i) => {
          const divider = i > 0 ? '<div class="sub-featured-divider"></div>' : '';
          return `${divider}<div class="sub-featured-group">
            <div class="sub-featured-group-header">
              <h3 class="sub-featured-group-title">${group.title}</h3>
              <span class="sub-featured-group-subtitle">${group.subtitle}</span>
            </div>
            <div class="sub-featured-group-cards">
              ${group.items.map(renderCard).join('')}
            </div>
          </div>`;
        }).join('');
        subFeatured.classList.add('sub-featured-grid--grouped');
        subFeatured.classList.remove('sub-featured-grid');
      } else if (data.featured && data.featured.length) {
        subFeatured.innerHTML = data.featured.map(renderCard).join('');
        subFeatured.classList.add('sub-featured-grid');
        subFeatured.classList.remove('sub-featured-grid--grouped');
      } else {
        subFeatured.innerHTML = '';
        subFeatured.classList.remove('sub-featured-grid', 'sub-featured-grid--grouped');
      }

      // Attach lightbox to grouped cards (with gallery)
      if (data.featuredGroups) {
        data.featuredGroups.forEach((group, gi) => {
          const gallery = group.gallery || group.items.filter(f => f.img).map(f => f.img);
          const groupEl = subFeatured.querySelectorAll('.sub-featured-group')[gi];
          if (groupEl) {
            groupEl.querySelectorAll('[data-lightbox]').forEach(card => {
              card.addEventListener('click', () => {
                const src = card.getAttribute('data-lightbox');
                const startIdx = gallery.indexOf(src);
                openGallery(gallery, startIdx >= 0 ? startIdx : 0);
              });
            });
          }
        });
      }

      // Attach lightbox to simple featured cards
      if (data.featured) {
        const allImgs = data.featured.filter(f => f.img).map(f => f.img);
        subFeatured.querySelectorAll('[data-lightbox]').forEach(card => {
          card.addEventListener('click', () => {
            const src = card.getAttribute('data-lightbox');
            const startIdx = allImgs.indexOf(src);
            openGallery(allImgs, startIdx >= 0 ? startIdx : 0);
          });
        });
      }
    }

    // Transition: hide grid, show detail
    subsGrid.classList.add('is-hidden');
    subDetail.classList.add('is-active');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        subDetail.classList.add('is-visible');
      });
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL hash
    if (pushHistory) {
      window.history.pushState({ sub: key }, '', '#' + key);
    }
  }

  // Show logo grid
  function showSubGrid() {
    subDetail.classList.remove('is-visible');
    setTimeout(() => {
      subDetail.classList.remove('is-active');
      subsGrid.classList.remove('is-hidden');
    }, 400);
  }

  // Click on a subsidiary logo
  document.querySelectorAll('[data-sub]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-sub');
      showSubDetail(key, true);
    });
  });

  // Back button
  if (subBack) {
    subBack.addEventListener('click', () => {
      window.history.back();
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.slice(1);
    if (hash && subsData[hash]) {
      showSubDetail(hash, false);
    } else {
      showSubGrid();
    }
  });

  // Handle initial load with hash
  if (window.location.hash) {
    const key = window.location.hash.slice(1);
    if (subsData[key]) {
      showSubDetail(key, false);
    }
  }
}

// ========== PROJECT DETAIL PAGE ==========
const pdetDetail = document.getElementById('projectDetail');

if (pdetDetail) {
  // Support both ?id=X (direct) and #X (clean URL fallback)
  const params = new URLSearchParams(window.location.search);
  const projectId = parseInt(params.get('id'), 10) || parseInt(window.location.hash.replace('#', ''), 10);

  // Sanitise a string for use inside a CSS url()
  function cssUrl(str) {
    return str ? str.replace(/['"\\()]/g, '\\$&') : '';
  }

  // Load data from Supabase (async)
  (async function() {
  const allProjects = await fetchProjects();
  const currentIdx = allProjects.findIndex(p => Number(p.id) === projectId);
  const project = currentIdx !== -1 ? allProjects[currentIdx] : null;

  if (project) {
    // Set page title
    document.title = `THEMELI — ${project.name}`;

    // Hero image
    const heroImg = document.getElementById('pdetHeroImg');
    if (project.image) {
      heroImg.style.backgroundImage = `url('${cssUrl(project.image)}')`;
      heroImg.classList.add('has-image');
    }

    // Content
    document.getElementById('pdetTag').textContent = project.typology;
    document.getElementById('pdetTitle').textContent = project.name;
    document.getElementById('pdetYear').textContent = project.year;
    document.getElementById('pdetLocation').textContent = project.location || '—';
    document.getElementById('pdetTypology').textContent = project.typology;
    document.getElementById('pdetDesc').textContent = project.description || '';

    // Info board
    const archEl = document.getElementById('pdetArchitect');
    const sizeEl = document.getElementById('pdetSize');
    const statusEl = document.getElementById('pdetStatus');
    const dateCompEl = document.getElementById('pdetDateCompleted');
    const infoLocEl = document.getElementById('pdetInfoLocation');
    const infoTypEl = document.getElementById('pdetInfoTypology');

    archEl.textContent = project.architect || '—';
    sizeEl.textContent = project.size || '—';
    statusEl.textContent = project.status || 'Completed';
    dateCompEl.textContent = project.dateCompleted || String(project.year);
    infoLocEl.textContent = project.location || '—';
    infoTypEl.textContent = project.typology;

    // Hide empty optional rows
    if (!project.architect) document.getElementById('pdetInfoArchitect').style.display = 'none';
    if (!project.size) document.getElementById('pdetInfoSize').style.display = 'none';

    // Related projects — same typology, excluding current
    const related = allProjects
      .filter(p => p.typology === project.typology && p.id !== project.id)
      .slice(0, 4);

    const relatedGrid = document.getElementById('pdetRelatedGrid');
    const relatedSection = document.getElementById('pdetRelated');

    if (related.length > 0 && relatedGrid) {
      related.forEach(p => {
        const imgStyle = p.image ? `background-image:url('${cssUrl(p.image)}')` : '';
        relatedGrid.insertAdjacentHTML('beforeend',
          `<a class="pdet-related-card" href="project.html#${p.id}">
            <div class="pdet-related-card-img" style="${imgStyle}"></div>
            <div class="pdet-related-card-body">
              <span class="pdet-related-card-name">${p.name}</span>
              <span class="pdet-related-card-meta">${p.typology} &middot; ${p.location || ''}</span>
            </div>
          </a>`
        );
      });
    } else if (relatedSection) {
      relatedSection.style.display = 'none';
    }

    // Adjacent project navigation
    const prevProject = currentIdx > 0 ? allProjects[currentIdx - 1] : null;
    const nextProject = currentIdx < allProjects.length - 1 ? allProjects[currentIdx + 1] : null;

    const prevLink = document.getElementById('pdetPrev');
    const nextLink = document.getElementById('pdetNext');
    const prevName = document.getElementById('pdetPrevName');
    const nextName = document.getElementById('pdetNextName');

    if (prevProject) {
      prevLink.href = `project.html#${prevProject.id}`;
      prevName.textContent = prevProject.name;
    } else {
      prevLink.style.visibility = 'hidden';
    }

    if (nextProject) {
      nextLink.href = `project.html#${nextProject.id}`;
      nextName.textContent = nextProject.name;
    } else {
      nextLink.style.visibility = 'hidden';
    }

    // Staggered reveal animation
    requestAnimationFrame(() => {
      pdetDetail.classList.add('is-loaded');
    });
  } else {
    // Project not found — redirect back
    window.location.href = 'projects.html';
  }
  })();
}

// ========== EMAIL POPUP ==========
document.querySelectorAll('.email-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = trigger.closest('.email-wrapper');
    // Close any other open popups
    document.querySelectorAll('.email-wrapper.active, .phone-wrapper.active').forEach(w => {
      if (w !== wrapper) w.classList.remove('active');
    });
    wrapper.classList.toggle('active');
  });
});

document.querySelectorAll('.email-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const email = btn.dataset.email;
    navigator.clipboard.writeText(email).then(() => {
      btn.textContent = T.copied;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = T.copyAddress;
        btn.classList.remove('copied');
        btn.closest('.email-wrapper').classList.remove('active');
      }, 1500);
    });
  });
});

// ========== PHONE POPUP ==========
document.querySelectorAll('.phone-trigger').forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const wrapper = trigger.closest('.phone-wrapper');
    document.querySelectorAll('.phone-wrapper.active, .email-wrapper.active').forEach(w => {
      if (w !== wrapper) w.classList.remove('active');
    });
    wrapper.classList.toggle('active');
  });
});

document.querySelectorAll('.phone-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const phone = btn.dataset.phone;
    navigator.clipboard.writeText(phone).then(() => {
      btn.textContent = T.copied;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = T.copyNumber;
        btn.classList.remove('copied');
        btn.closest('.phone-wrapper').classList.remove('active');
      }, 1500);
    });
  });
});

// Close popups when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.email-wrapper') && !e.target.closest('.phone-wrapper')) {
    document.querySelectorAll('.email-wrapper.active, .phone-wrapper.active').forEach(w => {
      w.classList.remove('active');
    });
  }
});
