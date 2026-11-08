// Категории каталога из Open Icecat: ID категории Icecat, характеристики и подписи на 10 языках.
// Один источник правды: из него импорт берёт маппинг (mapByConfig), а gen-sql.mjs строит миграцию.
// Признаки Icecat — по ID (глобальные), запасной вариант — по английскому названию.
// Лицензия OCL §10: данные Icecat только таблицей/фото, не в генеративный ИИ.

import { flatFeatures } from './map.mjs'

export const LANGS = ['en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'sv', 'pt-br', 'ja']

// ---------- преобразования значений ----------
const num = (f) => {
  if (!f || f.raw === '') return null
  const n = Number(String(f.raw).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}
const txt = (f) => {
  const t = f?.raw?.trim()
  return t && !/^(not available|n\/a|-)$/i.test(t) ? t : null
}
const yn = (f) => (!f || f.raw === '' ? null : f.raw === 'Y' ? true : f.raw === 'N' ? false : null)
const gb = (f) => {
  const n = num(f); if (n == null) return null
  const u = f.unit.toUpperCase()
  return u === 'MB' ? Math.round((n / 1024) * 100) / 100 : u === 'TB' ? n * 1024 : n
}
const res = (f) => { const m = /(\d+)\s*x\s*(\d+)/i.exec(f?.raw ?? ''); return m ? `${m[1]} × ${m[2]}` : null }
const kg = (f) => { const n = num(f); if (n == null) return null; return f.unit === 'kg' ? n : Math.round(n / 10) / 100 }
const hours = (f) => { const n = num(f); if (n == null) return null; return f.unit === 'min' ? Math.round((n / 60) * 10) / 10 : n }
const hz = (f) => { const t = txt(f); if (!t) return null; return /hz/i.test(t) ? t : `${t} Hz` }
const C = { num, txt, yn, gb, res, kg, hours, hz }

/** Спец-правила: значение из нескольких признаков. g(id|re) → признак. */
const SPECIAL = {
  cpu: (g) => {
    const fam = txt(g([2196, /^processor family$/i])), mdl = txt(g([47, /^processor model$/i]))
    return fam && mdl ? (mdl.toLowerCase().includes(fam.toLowerCase()) ? mdl : `${fam} ${mdl}`) : (mdl ?? fam)
  },
  gpu: (g) => txt(g([9018, /^discrete graphics card model$/i])) ?? txt(g([9016, /^on-board graphics card model$/i])),
  anc: (g) => {
    const t = txt(g([39802, /^noise canceling type$/i]))
    if (t) return /active/i.test(t)
    return null
  },
  curved: (g) => { const t = txt(g([17554, /^screen shape$/i])); return t ? /curved/i.test(t) : null },
  expandable: (g) => {
    const f = g([null, /memory card slot|compatible memory cards|maximum memory card size/i])
    return f ? f.raw !== 'N' : null
  },
  cellular: (g) => {
    const t = txt(g([40629, /^mobile network generation$/i]))
    if (t) return t
    const n = g([24557, /^mobile network connection$/i])
    return n?.raw === 'N' ? 'Wi-Fi' : null
  },
  usb: (g) => {
    const t = txt(g([1742, /^USB connector type$/i])) ?? txt(g([26352, /^USB connector$/i])), v = txt(g([8541, /^USB version$/i]))
    return t ? (v ? `${t} (${v})` : t) : null
  },
  wifi: (g) => txt(g([24993, /^top wi-fi standard$/i])) ?? txt(g([432, /^wi-fi standards$/i]))?.split(',')[0] ?? null,
  jack: (g) => {
    const a = g([14760, /^3\.5 mm connector$/i]); if (a) return yn(a)
    const t = txt(g([4163, /^headphone connectivity$/i])); return t ? /3\.5/.test(t) : null
  },
}

// ---------- подписи групп (новые; display/performance/camera/battery/body/connectivity/software уже в 0002) ----------
export const GROUP_LABELS = {
  audio:    ['Sound', 'Klang', 'Son', 'Audio', 'Sonido', 'Geluid', 'Dźwięk', 'Ljud', 'Som', 'サウンド'],
  picture:  ['Picture', 'Bild', 'Image', 'Immagine', 'Imagen', 'Beeld', 'Obraz', 'Bild', 'Imagem', '画質'],
  smart:    ['Smart features', 'Smart-Funktionen', 'Fonctions connectées', 'Funzioni smart', 'Funciones inteligentes', 'Slimme functies', 'Funkcje smart', 'Smarta funktioner', 'Recursos inteligentes', 'スマート機能'],
  ports:    ['Ports', 'Anschlüsse', 'Connectique', 'Porte', 'Puertos', 'Aansluitingen', 'Złącza', 'Anslutningar', 'Portas', '端子'],
  energy:   ['Energy', 'Energie', 'Énergie', 'Energia', 'Energía', 'Energie', 'Energia', 'Energi', 'Energia', 'エネルギー'],
  health:   ['Health & fitness', 'Gesundheit & Fitness', 'Santé & forme', 'Salute e fitness', 'Salud y fitness', 'Gezondheid & fitness', 'Zdrowie i fitness', 'Hälsa & träning', 'Saúde e fitness', '健康・フィットネス'],
  graphics: ['Graphics', 'Grafik', 'Graphismes', 'Grafica', 'Gráficos', 'Graphics', 'Grafika', 'Grafik', 'Gráficos', 'グラフィックス'],
}

// ---------- подписи характеристик (ключи, которых нет в 0002 или с другим смыслом) ----------
export const LABELS = {
  wearing_style:   ['Wearing style', 'Tragestil', 'Type de port', 'Tipo di indossamento', 'Tipo de uso', 'Draagwijze', 'Sposób noszenia', 'Bärstil', 'Estilo de uso', '装着方式'],
  ear_coupling:    ['Ear coupling', 'Ohrankopplung', 'Couplage auriculaire', 'Accoppiamento', 'Acoplamiento', 'Oorkoppeling', 'Typ przylegania', 'Öronkoppling', 'Acoplamento', 'イヤーカップ形状'],
  connection:      ['Connection', 'Verbindung', 'Connexion', 'Connessione', 'Conexión', 'Verbinding', 'Połączenie', 'Anslutning', 'Conexão', '接続方式'],
  anc:             ['Active noise cancelling', 'Aktive Geräuschunterdrückung', 'Réduction de bruit active', 'Cancellazione attiva del rumore', 'Cancelación activa de ruido', 'Actieve ruisonderdrukking', 'Aktywna redukcja szumów', 'Aktiv brusreducering', 'Cancelamento ativo de ruído', 'アクティブノイズキャンセリング'],
  driver_size:     ['Driver size', 'Treibergröße', 'Taille du haut-parleur', 'Dimensione driver', 'Tamaño del driver', 'Drivergrootte', 'Rozmiar przetwornika', 'Elementstorlek', 'Tamanho do driver', 'ドライバー径'],
  frequency_range: ['Frequency range', 'Frequenzbereich', 'Bande passante', 'Risposta in frequenza', 'Rango de frecuencia', 'Frequentiebereik', 'Pasmo przenoszenia', 'Frekvensomfång', 'Faixa de frequência', '周波数帯域'],
  impedance:       ['Impedance', 'Impedanz', 'Impédance', 'Impedenza', 'Impedancia', 'Impedantie', 'Impedancja', 'Impedans', 'Impedância', 'インピーダンス'],
  sensitivity:     ['Sensitivity', 'Empfindlichkeit', 'Sensibilité', 'Sensibilità', 'Sensibilidad', 'Gevoeligheid', 'Czułość', 'Känslighet', 'Sensibilidade', '感度'],
  microphone:      ['Microphone', 'Mikrofon', 'Microphone', 'Microfono', 'Micrófono', 'Microfoon', 'Mikrofon', 'Mikrofon', 'Microfone', 'マイク'],
  battery_life:    ['Battery life', 'Akkulaufzeit', 'Autonomie', 'Autonomia', 'Autonomía', 'Accuduur', 'Czas pracy na baterii', 'Batteritid', 'Autonomia da bateria', '連続使用時間'],
  charging_time:   ['Charging time', 'Ladezeit', 'Temps de charge', 'Tempo di ricarica', 'Tiempo de carga', 'Oplaadtijd', 'Czas ładowania', 'Laddningstid', 'Tempo de carga', '充電時間'],
  fast_charging:   ['Fast charging', 'Schnellladen', 'Charge rapide', 'Ricarica rapida', 'Carga rápida', 'Snelladen', 'Szybkie ładowanie', 'Snabbladdning', 'Carregamento rápido', '急速充電'],
  wireless_charging_support: ['Wireless charging', 'Kabelloses Laden', 'Charge sans fil', 'Ricarica wireless', 'Carga inalámbrica', 'Draadloos laden', 'Ładowanie bezprzewodowe', 'Trådlös laddning', 'Carregamento sem fio', 'ワイヤレス充電'],
  multipoint:      ['Simultaneous devices', 'Gleichzeitige Geräte', 'Appareils simultanés', 'Dispositivi simultanei', 'Dispositivos simultáneos', 'Gelijktijdige apparaten', 'Jednoczesne urządzenia', 'Samtidiga enheter', 'Dispositivos simultâneos', '同時接続台数'],
  foldable:        ['Foldable', 'Faltbar', 'Pliable', 'Pieghevole', 'Plegable', 'Opvouwbaar', 'Składane', 'Hopfällbar', 'Dobrável', '折りたたみ'],
  resolution_class:['Resolution class', 'Auflösungsklasse', 'Définition', 'Risoluzione', 'Resolución', 'Resolutieklasse', 'Klasa rozdzielczości', 'Upplösningsklass', 'Classe de resolução', '解像度クラス'],
  hdr:             ['HDR formats', 'HDR-Formate', 'Formats HDR', 'Formati HDR', 'Formatos HDR', 'HDR-formaten', 'Formaty HDR', 'HDR-format', 'Formatos HDR', 'HDR規格'],
  dolby_vision:    ['Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision', 'Dolby Vision'],
  picture_processor:['Picture processor', 'Bildprozessor', "Processeur d'image", 'Processore video', 'Procesador de imagen', 'Beeldprocessor', 'Procesor obrazu', 'Bildprocessor', 'Processador de imagem', '映像エンジン'],
  speaker_power:   ['Speaker power', 'Lautsprecherleistung', 'Puissance audio', 'Potenza audio', 'Potencia de audio', 'Luidsprekervermogen', 'Moc głośników', 'Högtalareffekt', 'Potência de áudio', 'スピーカー出力'],
  audio_channels:  ['Audio channels', 'Audiokanäle', 'Canaux audio', 'Canali audio', 'Canales de audio', 'Audiokanalen', 'Kanały audio', 'Ljudkanaler', 'Canais de áudio', 'チャンネル'],
  smart_tv:        ['Smart TV', 'Smart-TV', 'Smart TV', 'Smart TV', 'Smart TV', 'Smart-tv', 'Smart TV', 'Smart-TV', 'Smart TV', 'スマートTV'],
  hdmi_ports:      ['HDMI ports', 'HDMI-Anschlüsse', 'Ports HDMI', 'Porte HDMI', 'Puertos HDMI', 'HDMI-poorten', 'Porty HDMI', 'HDMI-portar', 'Portas HDMI', 'HDMI端子数'],
  hdmi_version:    ['HDMI version', 'HDMI-Version', 'Version HDMI', 'Versione HDMI', 'Versión HDMI', 'HDMI-versie', 'Wersja HDMI', 'HDMI-version', 'Versão HDMI', 'HDMIバージョン'],
  earc:            ['eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC', 'eARC'],
  freesync:        ['AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync', 'AMD FreeSync'],
  gsync:           ['NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC', 'NVIDIA G-SYNC'],
  energy_class:    ['Energy class', 'Energieeffizienzklasse', 'Classe énergétique', 'Classe energetica', 'Clase energética', 'Energieklasse', 'Klasa energetyczna', 'Energiklass', 'Classe energética', '省エネ等級'],
  power_typical:   ['Power consumption', 'Leistungsaufnahme', 'Consommation', 'Consumo', 'Consumo', 'Stroomverbruik', 'Pobór mocy', 'Effektförbrukning', 'Consumo de energia', '消費電力'],
  weight_kg:       ['Weight', 'Gewicht', 'Poids', 'Peso', 'Peso', 'Gewicht', 'Waga', 'Vikt', 'Peso', '重量'],
  depth_mm:        ['Depth', 'Tiefe', 'Profondeur', 'Profondità', 'Profundidad', 'Diepte', 'Głębokość', 'Djup', 'Profundidade', '奥行き'],
  vesa:            ['VESA mount', 'VESA-Halterung', 'Fixation VESA', 'Attacco VESA', 'Montaje VESA', 'VESA-bevestiging', 'Mocowanie VESA', 'VESA-fäste', 'Suporte VESA', 'VESAマウント'],
  touchscreen:     ['Touchscreen', 'Touchscreen', 'Écran tactile', 'Touchscreen', 'Pantalla táctil', 'Touchscreen', 'Ekran dotykowy', 'Pekskärm', 'Tela sensível ao toque', 'タッチスクリーン'],
  cpu:             ['Processor', 'Prozessor', 'Processeur', 'Processore', 'Procesador', 'Processor', 'Procesor', 'Processor', 'Processador', 'プロセッサー'],
  cpu_threads:     ['Processor threads', 'Prozessor-Threads', 'Threads', 'Thread', 'Hilos', 'Threads', 'Wątki procesora', 'Trådar', 'Threads', 'スレッド数'],
  cpu_boost:       ['Boost clock', 'Boost-Takt', 'Fréquence turbo', 'Frequenza turbo', 'Frecuencia turbo', 'Boostfrequentie', 'Taktowanie turbo', 'Boostfrekvens', 'Frequência turbo', '最大クロック'],
  ram_type:        ['Memory type', 'Speichertyp', 'Type de mémoire', 'Tipo di memoria', 'Tipo de memoria', 'Geheugentype', 'Typ pamięci', 'Minnestyp', 'Tipo de memória', 'メモリー種類'],
  storage_type:    ['Storage type', 'Speicherart', 'Type de stockage', 'Tipo di archiviazione', 'Tipo de almacenamiento', 'Opslagtype', 'Typ dysku', 'Lagringstyp', 'Tipo de armazenamento', 'ストレージ種類'],
  gpu:             ['Graphics', 'Grafikkarte', 'Carte graphique', 'Scheda grafica', 'Tarjeta gráfica', 'Videokaart', 'Karta graficzna', 'Grafikkort', 'Placa de vídeo', 'グラフィックス'],
  discrete_gpu:    ['Dedicated graphics', 'Dedizierte Grafik', 'Graphique dédiée', 'Grafica dedicata', 'Gráfica dedicada', 'Losse videokaart', 'Dedykowana grafika', 'Dedikerad grafik', 'Placa de vídeo dedicada', '専用GPU'],
  battery_wh:      ['Battery capacity', 'Akkukapazität', 'Capacité de la batterie', 'Capacità batteria', 'Capacidad de batería', 'Accucapaciteit', 'Pojemność baterii', 'Batterikapacitet', 'Capacidade da bateria', 'バッテリー容量'],
  adapter_power:   ['Power adapter', 'Netzteilleistung', "Puissance de l'adaptateur", 'Potenza alimentatore', 'Potencia del adaptador', 'Adaptervermogen', 'Moc zasilacza', 'Nätadapter', 'Potência do carregador', 'ACアダプター出力'],
  keyboard_backlit:['Backlit keyboard', 'Beleuchtete Tastatur', 'Clavier rétroéclairé', 'Tastiera retroilluminata', 'Teclado retroiluminado', 'Verlicht toetsenbord', 'Podświetlana klawiatura', 'Bakgrundsbelyst tangentbord', 'Teclado retroiluminado', 'バックライトキーボード'],
  fingerprint:     ['Fingerprint reader', 'Fingerabdruckleser', "Lecteur d'empreintes", 'Lettore di impronte', 'Lector de huellas', 'Vingerafdrukscanner', 'Czytnik linii papilarnych', 'Fingeravtrycksläsare', 'Leitor de impressão digital', '指紋センサー'],
  cellular:        ['Mobile network', 'Mobilfunk', 'Réseau mobile', 'Rete mobile', 'Red móvil', 'Mobiel netwerk', 'Sieć komórkowa', 'Mobilnät', 'Rede móvel', 'モバイル通信'],
  always_on:       ['Always-on display', 'Always-on-Display', 'Écran toujours allumé', 'Display always-on', 'Pantalla siempre activa', 'Always-on-display', 'Always-on display', 'Alltid på-skärm', 'Tela sempre ativa', '常時表示'],
  case_size:       ['Case size', 'Gehäusegröße', 'Taille du boîtier', 'Dimensione cassa', 'Tamaño de caja', 'Kastgrootte', 'Rozmiar koperty', 'Boettstorlek', 'Tamanho da caixa', 'ケースサイズ'],
  case_material:   ['Case material', 'Gehäusematerial', 'Matériau du boîtier', 'Materiale cassa', 'Material de la caja', 'Kastmateriaal', 'Materiał koperty', 'Boettmaterial', 'Material da caixa', 'ケース素材'],
  water_resistance:['Water resistance', 'Wasserdichtigkeit', "Étanchéité", 'Impermeabilità', 'Resistencia al agua', 'Waterdichtheid', 'Wodoszczelność', 'Vattentäthet', 'Resistência à água', '防水性能'],
  gps:             ['GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS', 'GPS'],
  lte:             ['LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE (eSIM)', 'LTE（eSIM）'],
  heart_rate:      ['Heart rate monitor', 'Herzfrequenzmessung', 'Cardiofréquencemètre', 'Cardiofrequenzimetro', 'Pulsómetro', 'Hartslagmeter', 'Pomiar tętna', 'Pulsmätare', 'Monitor cardíaco', '心拍計'],
  spo2:            ['Blood oxygen (SpO2)', 'Blutsauerstoff (SpO2)', 'Oxygène sanguin (SpO2)', 'Ossigeno nel sangue (SpO2)', 'Oxígeno en sangre (SpO2)', 'Bloedzuurstof (SpO2)', 'Natlenienie krwi (SpO2)', 'Syremättnad (SpO2)', 'Oxigênio no sangue (SpO2)', '血中酸素（SpO2）'],
  ecg:             ['ECG', 'EKG', 'ECG', 'ECG', 'ECG', 'ECG', 'EKG', 'EKG', 'ECG', '心電図'],
  fall_detection:  ['Fall detection', 'Sturzerkennung', 'Détection de chute', 'Rilevamento cadute', 'Detección de caídas', 'Valdetectie', 'Wykrywanie upadków', 'Falldetektering', 'Detecção de queda', '転倒検出'],
  response_time:   ['Response time', 'Reaktionszeit', 'Temps de réponse', 'Tempo di risposta', 'Tiempo de respuesta', 'Responstijd', 'Czas reakcji', 'Svarstid', 'Tempo de resposta', '応答速度'],
  contrast:        ['Contrast ratio', 'Kontrastverhältnis', 'Contraste', 'Contrasto', 'Contraste', 'Contrastverhouding', 'Kontrast', 'Kontrast', 'Contraste', 'コントラスト比'],
  aspect_ratio:    ['Aspect ratio', 'Seitenverhältnis', "Format d'image", 'Formato', 'Relación de aspecto', 'Beeldverhouding', 'Proporcje ekranu', 'Bildformat', 'Proporção', 'アスペクト比'],
  curved:          ['Curved screen', 'Gebogener Bildschirm', 'Écran incurvé', 'Schermo curvo', 'Pantalla curva', 'Gebogen scherm', 'Zakrzywiony ekran', 'Böjd skärm', 'Tela curva', '曲面ディスプレイ'],
  srgb:            ['sRGB coverage', 'sRGB-Abdeckung', 'Couverture sRGB', 'Copertura sRGB', 'Cobertura sRGB', 'sRGB-dekking', 'Pokrycie sRGB', 'sRGB-täckning', 'Cobertura sRGB', 'sRGBカバー率'],
  hdr_support:     ['HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR', 'HDR'],
  displayport:     ['DisplayPort version', 'DisplayPort-Version', 'Version DisplayPort', 'Versione DisplayPort', 'Versión DisplayPort', 'DisplayPort-versie', 'Wersja DisplayPort', 'DisplayPort-version', 'Versão DisplayPort', 'DisplayPortバージョン'],
  speakers:        ['Built-in speakers', 'Integrierte Lautsprecher', 'Haut-parleurs intégrés', 'Altoparlanti integrati', 'Altavoces integrados', 'Ingebouwde luidsprekers', 'Wbudowane głośniki', 'Inbyggda högtalare', 'Alto-falantes integrados', '内蔵スピーカー'],
  height_adjust:   ['Height adjustment', 'Höhenverstellung', 'Réglage en hauteur', 'Regolazione altezza', 'Ajuste de altura', 'Hoogteverstelling', 'Regulacja wysokości', 'Höjdjustering', 'Ajuste de altura', '高さ調整'],
  speaker_type:    ['Speaker type', 'Lautsprechertyp', "Type d'enceinte", 'Tipo di altoparlante', 'Tipo de altavoz', 'Type luidspreker', 'Typ głośnika', 'Högtalartyp', 'Tipo de alto-falante', 'スピーカー種類'],
  drivers:         ['Number of drivers', 'Anzahl der Treiber', 'Nombre de haut-parleurs', 'Numero di driver', 'Número de altavoces', 'Aantal drivers', 'Liczba przetworników', 'Antal element', 'Número de drivers', 'スピーカー数'],
  airplay:         ['AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay'],
  wifi_support:    ['Wi-Fi', 'WLAN', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi', 'Wifi', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi'],
  handsfree:       ['Hands-free calls', 'Freisprechen', 'Mains libres', 'Vivavoce', 'Manos libres', 'Handsfree bellen', 'Zestaw głośnomówiący', 'Handsfree', 'Viva-voz', 'ハンズフリー通話'],
  ip_rating:       ['Water & dust (IP)', 'Wasser- & Staubschutz (IP)', 'Étanchéité (IP)', 'Protezione (IP)', 'Protección (IP)', 'Water- en stofdicht (IP)', 'Odporność (IP)', 'Vatten- & dammskydd (IP)', 'Proteção (IP)', '防水防塵（IP）'],
  bluetooth:       ['Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth'],
}

// s(key, group, type, unit, higherIsBetter, keySpec, filter, pick | special-name, conv)
const s = (key, group, type, unit, hib, isKey, isFilter, pick, conv = type === 'bool' ? 'yn' : type === 'text' ? 'txt' : 'num') =>
  ({ key, group, type, unit, hib, isKey, isFilter, pick, conv })

// ---------- категории ----------
export const CATEGORIES = {
  headphones: {
    catid: '1637', sort: 30, min: 8, codeAsName: false,
    i18n: { en: ['headphones', 'Headphones'], de: ['kopfhoerer', 'Kopfhörer'], fr: ['casques-ecouteurs', 'Casques & écouteurs'], it: ['cuffie', 'Cuffie'], es: ['auriculares', 'Auriculares'], nl: ['koptelefoons', 'Koptelefoons'], pl: ['sluchawki', 'Słuchawki'], sv: ['horlurar', 'Hörlurar'], 'pt-br': ['fones-de-ouvido', 'Fones de ouvido'], ja: ['headphones', 'ヘッドホン・イヤホン'] },
    specs: [
      s('wearing_style', 'body', 'text', null, null, true, true, [8136, /^wearing style$/i]),
      s('ear_coupling', 'body', 'text', null, null, false, false, [2527, /^ear coupling$/i]),
      s('connection', 'connectivity', 'text', null, null, true, true, [1655, /^connectivity technology$/i]),
      s('anc', 'audio', 'bool', null, true, true, true, 'anc'),
      s('driver_size', 'audio', 'number', 'mm', true, false, false, [2379, /^driver unit$/i]),
      s('frequency_range', 'audio', 'text', null, null, false, false, [1887, /^headphone frequency$/i], 'hz'),
      s('impedance', 'audio', 'number', 'Ω', null, false, false, [1889, /^impedance$/i]),
      s('sensitivity', 'audio', 'number', 'dB', true, false, false, [1888, /^headphone sensitivity$/i]),
      s('microphone', 'audio', 'bool', null, true, false, true, [2314, /^microphone in$/i]),
      s('battery_life', 'battery', 'number', 'h', true, true, true, [[2169, /^continuous audio playback time$/i], [42969, /playback time \(anc off\)/i], [13910, /^battery life$/i]], 'hours'),
      s('charging_time', 'battery', 'number', 'h', false, false, false, [1535, /^battery recharge time$/i], 'hours'),
      s('fast_charging', 'battery', 'bool', null, true, false, false, [4981, /^fast charging$/i]),
      s('wireless_charging_support', 'battery', 'bool', null, true, false, true, [12148, /^wireless charging$/i]),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('multipoint', 'connectivity', 'number', null, true, false, false, [9686, /simultaneously connected devices/i]),
      s('usb', 'connectivity', 'text', null, null, false, false, 'usb'),
      s('headphone_jack', 'connectivity', 'bool', null, true, false, false, 'jack'),
      s('ip_rating', 'body', 'text', null, null, false, true, [7900, /international protection \(ip\) code/i]),
      s('foldable', 'body', 'bool', null, null, false, false, [2882, /^foldable$/i]),
      s('weight', 'body', 'number', 'g', false, true, false, [94, /^weight$/i]),
    ],
  },

  laptops: {
    catid: '151', sort: 20, min: 10, codeAsName: false,
    i18n: { en: ['laptops', 'Laptops'], de: ['laptops', 'Laptops'], fr: ['ordinateurs-portables', 'Ordinateurs portables'], it: ['notebook', 'Notebook'], es: ['portatiles', 'Portátiles'], nl: ['laptops', 'Laptops'], pl: ['laptopy', 'Laptopy'], sv: ['barbara-datorer', 'Bärbara datorer'], 'pt-br': ['notebooks', 'Notebooks'], ja: ['laptops', 'ノートパソコン'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_resolution', 'display', 'text', null, null, false, true, [1585, /^display resolution$/i], 'res'),
      s('display_type', 'display', 'text', null, null, false, true, [15285, /^panel type$/i]),
      s('refresh_rate', 'display', 'number', 'Hz', true, false, true, [7450, /^maximum refresh rate$/i]),
      s('peak_brightness', 'display', 'number', 'nits', true, false, false, [1389, /^display brightness$/i]),
      s('touchscreen', 'display', 'bool', null, null, false, true, [4963, /^touchscreen$/i]),
      s('cpu', 'performance', 'text', null, null, true, true, 'cpu'),
      s('cpu_threads', 'performance', 'number', null, true, false, false, [7337, /^processor threads$/i]),
      s('cpu_boost', 'performance', 'number', 'GHz', true, false, false, [7978, /^processor boost frequency$/i]),
      s('ram', 'performance', 'number', 'GB', true, true, true, [11381, /^internal memory$/i], 'gb'),
      s('ram_type', 'performance', 'text', null, null, false, false, [427, /^internal memory type$/i]),
      s('storage', 'performance', 'number', 'GB', true, true, true, [3318, /^total storage capacity$/i], 'gb'),
      s('storage_type', 'performance', 'text', null, null, false, false, [11441, /^storage media$/i]),
      s('gpu', 'graphics', 'text', null, null, true, true, 'gpu'),
      s('discrete_gpu', 'graphics', 'bool', null, true, false, true, [27905, /^discrete graphics card$/i]),
      s('battery_wh', 'battery', 'number', 'Wh', true, false, false, [8519, /^battery capacity$/i]),
      s('battery_life', 'battery', 'number', 'h', true, false, true, [1721, /^battery life \(max\)$/i], 'hours'),
      s('adapter_power', 'battery', 'number', 'W', null, false, false, [906, /^AC adapter power$/i]),
      s('wifi', 'connectivity', 'text', null, null, false, false, 'wifi'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('keyboard_backlit', 'body', 'bool', null, true, false, true, [11149, /^keyboard backlit$/i]),
      s('fingerprint', 'body', 'bool', null, true, false, false, [3577, /^fingerprint reader$/i]),
      s('os', 'software', 'text', null, null, false, true, [3233, /^operating system installed$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, true, true, [94, /^weight$/i], 'kg'),
      s('thickness', 'body', 'number', 'mm', false, false, false, [1464, /^height$/i]),
    ],
  },

  tvs: {
    catid: '1584', sort: 40, min: 10, codeAsName: true,
    i18n: { en: ['tvs', 'TVs'], de: ['fernseher', 'Fernseher'], fr: ['televiseurs', 'Téléviseurs'], it: ['televisori', 'Televisori'], es: ['televisores', 'Televisores'], nl: ['televisies', 'Televisies'], pl: ['telewizory', 'Telewizory'], sv: ['tv-apparater', 'TV-apparater'], 'pt-br': ['tvs', 'TVs'], ja: ['tvs', 'テレビ'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('resolution_class', 'display', 'text', null, null, true, true, [11424, /^HD type$/i]),
      s('display_resolution', 'display', 'text', null, null, false, false, [1585, /^display resolution$/i], 'res'),
      s('display_type', 'display', 'text', null, null, true, true, [9713, /^display technology$/i]),
      s('refresh_rate', 'display', 'number', 'Hz', true, false, true, [[35746, /^native refresh rate$/i], [7450, /^maximum refresh rate$/i]]),
      s('hdr', 'picture', 'text', null, null, false, false, [40712, /high dynamic range \(hdr\) technology/i]),
      s('dolby_vision', 'picture', 'bool', null, true, false, true, [39354, /^dolby vision$/i]),
      s('picture_processor', 'picture', 'text', null, null, false, false, [20225, /^processor$/i]),
      s('speaker_power', 'audio', 'number', 'W', true, false, false, [1854, /^RMS rated power$/i]),
      s('audio_channels', 'audio', 'text', null, null, false, false, [2197, /^audio output channels$/i]),
      s('smart_tv', 'smart', 'bool', null, true, false, true, [9841, /^smart tv$/i]),
      s('os', 'smart', 'text', null, null, false, true, [3233, /^operating system installed$/i]),
      s('hdmi_ports', 'ports', 'number', null, true, false, false, [3566, /^HDMI ports quantity$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('earc', 'ports', 'bool', null, true, false, false, [39356, /enhanced audio return channel/i]),
      s('freesync', 'picture', 'bool', null, true, false, false, [29607, /^AMD FreeSync$/i]),
      s('wifi', 'connectivity', 'text', null, null, false, false, 'wifi'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('energy_class', 'energy', 'text', null, null, false, true, [[42856, /^energy efficiency class \(SDR\)$/i], [2705, /^energy efficiency class$/i]]),
      s('power_typical', 'energy', 'number', 'W', false, false, false, [445, /^power consumption \(typical\)$/i]),
      s('vesa', 'body', 'text', null, null, false, false, [4037, /^panel mounting interface$/i]),
      s('depth_mm', 'body', 'number', 'mm', false, false, false, [12577, /^depth \(without stand\)$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, false, false, [12573, /^weight \(without stand\)$/i], 'kg'),
    ],
  },

  tablets: {
    catid: '897', sort: 50, min: 10, codeAsName: false,
    i18n: { en: ['tablets', 'Tablets'], de: ['tablets', 'Tablets'], fr: ['tablettes', 'Tablettes'], it: ['tablet', 'Tablet'], es: ['tablets', 'Tablets'], nl: ['tablets', 'Tablets'], pl: ['tablety', 'Tablety'], sv: ['surfplattor', 'Surfplattor'], 'pt-br': ['tablets', 'Tablets'], ja: ['tablets', 'タブレット'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_resolution', 'display', 'text', null, null, false, false, [1585, /^display resolution$/i], 'res'),
      s('display_type', 'display', 'text', null, null, false, true, [[46952, /display technology marketing name/i], [15285, /^panel type$/i], [9713, /^display technology$/i]]),
      s('refresh_rate', 'display', 'number', 'Hz', true, false, true, [7450, /^maximum refresh rate$/i]),
      s('chipset', 'performance', 'text', null, null, true, true, 'cpu'),
      s('ram', 'performance', 'number', 'GB', true, true, true, [[7861, /^RAM capacity$/i], [11381, /^internal memory$/i]], 'gb'),
      s('storage', 'performance', 'number', 'GB', true, false, true, [[8730, /^internal storage capacity$/i], [3318, /^total storage capacity$/i]], 'gb'),
      s('expandable_storage', 'performance', 'bool', null, true, false, true, 'expandable'),
      s('main_camera', 'camera', 'number', 'MP', true, false, false, [12435, /^rear camera resolution \(numeric\)$/i]),
      s('front_camera', 'camera', 'number', 'MP', true, false, false, [12437, /^front camera resolution \(numeric\)$/i]),
      s('battery', 'battery', 'number', 'mAh', true, true, true, [909, /^battery capacity$/i]),
      s('cellular', 'connectivity', 'text', null, null, false, true, 'cellular'),
      s('wifi', 'connectivity', 'text', null, null, false, false, 'wifi'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('usb', 'connectivity', 'text', null, null, false, false, 'usb'),
      s('headphone_jack', 'connectivity', 'bool', null, true, false, true, 'jack'),
      s('os', 'software', 'text', null, null, false, true, [3233, /^operating system installed$/i]),
      s('weight', 'body', 'number', 'g', false, true, false, [94, /^weight$/i]),
      s('thickness', 'body', 'number', 'mm', false, false, false, [1650, /^depth$/i]),
    ],
  },

  smartwatches: {
    catid: '2647', sort: 80, min: 8, codeAsName: false,
    i18n: { en: ['smartwatches', 'Smartwatches'], de: ['smartwatches', 'Smartwatches'], fr: ['montres-connectees', 'Montres connectées'], it: ['smartwatch', 'Smartwatch'], es: ['relojes-inteligentes', 'Relojes inteligentes'], nl: ['smartwatches', 'Smartwatches'], pl: ['smartwatche', 'Smartwatche'], sv: ['smartklockor', 'Smartklockor'], 'pt-br': ['smartwatches', 'Smartwatches'], ja: ['smartwatches', 'スマートウォッチ'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_type', 'display', 'text', null, null, false, true, [[46952, /display technology marketing name/i], [9713, /^display technology$/i]]),
      s('display_resolution', 'display', 'text', null, null, false, false, [1585, /^display resolution$/i], 'res'),
      s('peak_brightness', 'display', 'number', 'nits', true, false, false, [1389, /^display brightness$/i]),
      s('always_on', 'display', 'bool', null, true, false, true, [39552, /^always-on display$/i]),
      s('case_size', 'body', 'number', 'mm', null, true, true, [42415, /^watch case size$/i]),
      s('case_material', 'body', 'text', null, null, false, true, [42418, /^watch case material$/i]),
      s('ip_rating', 'body', 'text', null, null, false, false, [7900, /international protection \(ip\) code/i]),
      s('water_resistance', 'body', 'text', null, null, false, true, [18048, /^water resistance$/i]),
      s('os', 'software', 'text', null, null, true, true, [3233, /^operating system installed$/i]),
      s('gps', 'health', 'bool', null, true, false, true, [3329, /^GPS \(satellite\)$/i]),
      s('heart_rate', 'health', 'bool', null, true, false, false, [6702, /^heart rate monitor$/i]),
      s('spo2', 'health', 'bool', null, true, false, true, [42444, /^blood oxygen sensor$/i]),
      s('ecg', 'health', 'bool', null, true, false, true, [null, /electrocardiogram|\bECG\b/i]),
      s('fall_detection', 'health', 'bool', null, true, false, false, [39896, /^fall detection$/i]),
      s('lte', 'connectivity', 'bool', null, true, false, true, [24557, /^mobile network connection$/i]),
      s('nfc', 'connectivity', 'bool', null, true, false, true, [10157, /near field communication/i]),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('battery', 'battery', 'number', 'mAh', true, true, false, [909, /^battery capacity$/i]),
      s('battery_life', 'battery', 'number', 'h', true, false, true, [null, /^battery life( \(max\))?$/i], 'hours'),
      s('wireless_charging_support', 'battery', 'bool', null, true, false, false, [12148, /^wireless charging$/i]),
      s('weight', 'body', 'number', 'g', false, false, false, [94, /^weight$/i]),
      s('thickness', 'body', 'number', 'mm', false, false, false, [2757, /^thickness$/i]),
    ],
  },

  monitors: {
    catid: '222', sort: 90, min: 10, codeAsName: true,
    i18n: { en: ['monitors', 'Monitors'], de: ['monitore', 'Monitore'], fr: ['ecrans-pc', 'Écrans PC'], it: ['monitor', 'Monitor'], es: ['monitores', 'Monitores'], nl: ['monitoren', 'Monitoren'], pl: ['monitory', 'Monitory'], sv: ['bildskarmar', 'Bildskärmar'], 'pt-br': ['monitores', 'Monitores'], ja: ['monitors', 'モニター'] },
    specs: [
      s('display_size', 'display', 'number', 'in', null, true, true, [944, /^display diagonal$/i]),
      s('display_resolution', 'display', 'text', null, null, true, true, [1585, /^display resolution$/i], 'res'),
      s('resolution_class', 'display', 'text', null, null, false, true, [11424, /^HD type$/i]),
      s('display_type', 'display', 'text', null, null, false, true, [15285, /^panel type$/i]),
      s('refresh_rate', 'display', 'number', 'Hz', true, true, true, [7450, /^maximum refresh rate$/i]),
      s('response_time', 'display', 'number', 'ms', false, false, true, [1516, /^response time$/i]),
      s('peak_brightness', 'display', 'number', 'nits', true, false, false, [[36441, /^display brightness \(typical\)$/i], [1389, /^display brightness$/i]]),
      s('contrast', 'display', 'text', null, null, false, false, [34, /^contrast ratio \(typical\)$/i]),
      s('aspect_ratio', 'display', 'text', null, null, false, true, [11417, /^native aspect ratio$/i]),
      s('curved', 'display', 'bool', null, null, false, true, 'curved'),
      s('srgb', 'picture', 'number', '%', true, false, false, [28703, /^sRGB coverage/i]),
      s('hdr_support', 'picture', 'bool', null, true, false, true, [36310, /high dynamic range \(hdr\) supported/i]),
      s('freesync', 'picture', 'bool', null, true, false, true, [29607, /^AMD FreeSync$/i]),
      s('gsync', 'picture', 'bool', null, true, false, true, [20783, /^NVIDIA G-SYNC$/i]),
      s('hdmi_version', 'ports', 'text', null, null, false, false, [5452, /^HDMI version$/i]),
      s('displayport', 'ports', 'text', null, null, false, false, [11111, /^DisplayPort version$/i]),
      s('speakers', 'audio', 'bool', null, true, false, false, [2433, /^built-in speaker\(s\)$/i]),
      s('height_adjust', 'body', 'bool', null, true, false, true, [1954, /^height adjustment$/i]),
      s('vesa', 'body', 'text', null, null, false, false, [4037, /^panel mounting interface$/i]),
      s('energy_class', 'energy', 'text', null, null, false, false, [[42856, /^energy efficiency class \(SDR\)$/i], [2705, /^energy efficiency class$/i]]),
      s('power_typical', 'energy', 'number', 'W', false, false, false, [445, /^power consumption \(typical\)$/i]),
      s('weight_kg', 'body', 'number', 'kg', false, false, false, [[19017, /^weight \(with stand\)$/i], [12573, /^weight \(without stand\)$/i]], 'kg'),
    ],
  },

  speakers: {
    catid: '2315', sort: 110, min: 8, codeAsName: false,
    i18n: { en: ['speakers', 'Speakers'], de: ['lautsprecher', 'Lautsprecher'], fr: ['enceintes', 'Enceintes'], it: ['casse', 'Casse'], es: ['altavoces', 'Altavoces'], nl: ['speakers', 'Speakers'], pl: ['glosniki', 'Głośniki'], sv: ['hogtalare', 'Högtalare'], 'pt-br': ['caixas-de-som', 'Caixas de som'], ja: ['speakers', 'スピーカー'] },
    specs: [
      s('speaker_type', 'audio', 'text', null, null, true, true, [14052, /^product type$/i]),
      s('speaker_power', 'audio', 'number', 'W', true, true, true, [1854, /^RMS rated power$/i]),
      s('frequency_range', 'audio', 'text', null, null, false, false, [5528, /^frequency range$/i], 'hz'),
      s('drivers', 'audio', 'number', null, true, false, false, [10183, /^number of speakers$/i]),
      s('battery_life', 'battery', 'number', 'h', true, true, true, [1721, /^battery life \(max\)$/i], 'hours'),
      s('charging_time', 'battery', 'number', 'h', false, false, false, [1535, /^battery recharge time$/i], 'hours'),
      s('bluetooth', 'connectivity', 'text', null, null, false, false, [1208, /^bluetooth version$/i]),
      s('wifi_support', 'connectivity', 'bool', null, true, false, true, [3239, /^wi-fi$/i]),
      s('airplay', 'connectivity', 'bool', null, true, false, true, [9763, /^airplay$/i]),
      s('nfc', 'connectivity', 'bool', null, true, false, false, [10157, /near field communication/i]),
      s('usb', 'connectivity', 'text', null, null, false, false, 'usb'),
      s('handsfree', 'audio', 'bool', null, true, false, false, [2668, /^hands-free mode$/i]),
      s('ip_rating', 'body', 'text', null, null, false, true, [7900, /international protection \(ip\) code/i]),
      s('weight', 'body', 'number', 'g', false, true, false, [94, /^weight$/i]),
    ],
  },
}

function pickFeature(fs, p) {
  const [id, re] = p
  return fs.find((f) => id != null && f.id === id) ?? fs.find((f) => re.test(f.name)) ?? null
}

/** Карточка Icecat → { key: value } по описанию категории. */
export function mapByConfig(cfg, data) {
  const fs = flatFeatures(data)
  const g = (p) => pickFeature(fs, p)
  const out = {}
  for (const sp of cfg.specs) {
    let v = null
    if (typeof sp.pick === 'string') v = SPECIAL[sp.pick](g)
    else {
      const list = Array.isArray(sp.pick[0]) ? sp.pick : [sp.pick]
      for (const p of list) { v = C[sp.conv](g(p)); if (v != null) break }
    }
    if (sp.key === 'lte' && v != null) v = v === true // «Mobile network connection» Y → есть LTE
    out[sp.key] = v
  }
  return out
}
