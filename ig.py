import requests
import random
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance
from io import BytesIO
import textwrap
import os
import datetime
import math

# --- CONFIGURAZIONE ---
API_TOKEN = "Bearer 4b84405e-5034-42d2-aac3-6a6275c826d1"
BASE_URL = "https://batoo.api.digibusiness.it/Navis2WS/v2/boats"

# --- FILTRI RICERCA ---
PRICE_FROM = 600000
PRICE_TO = 3000000
YEAR_FROM = 2010
YEAR_TO = 2025
LENGTH_FROM = 5.0
LENGTH_TO = 15.0

# --- SELEZIONE ---
SELECTION_NUMBER = 2
PAGE_SIZE = 50

# Configurazione Grafica
W, H = 1080, 1350
COLORE_SFONDO = "#F5F5F5" # Grigio chiarissimo per lo sfondo generale
COLORE_CARD = "#FFFFFF"   # Bianco per l'area testo
COLORE_TESTO_TITOLO = "#111111"
COLORE_TESTO_ACCENT = "#1e3a8a" # Blu
COLORE_TESTO_PREZZO = "#000000"
COLORE_TESTO_SPECS = "#666666"
FONT_PATH = "BricolageGrotesque.ttf"

def get_best_boats(count=6):
    """Scarica tutti i dati delle barche gestendo la paginazione."""
    headers = {'Authorization': API_TOKEN, 'Accept': 'application/json'}
    print(f"📡 Cercando barche (Price: {PRICE_FROM}-{PRICE_TO}, Year: {YEAR_FROM}-{YEAR_TO}, Len: {LENGTH_FROM}-{LENGTH_TO})...")
    
    all_boats_results = []
    total_results = None
    current_start = 0
    
    # Base params with filters
    base_params = {
        "priceFrom": PRICE_FROM,
        "priceTo": PRICE_TO,
        "yearFrom": YEAR_FROM,
        "yearTo": YEAR_TO,
        "lengthFrom": LENGTH_FROM,
        "lengthTo": LENGTH_TO
    }
    
    print("🚀 Inizio: Recupero conteggio totale e gestione paginazione...")
    
    try:
        # 1. Chiamata iniziale
        params = base_params.copy()
        params.update({'start': current_start, 'limit': PAGE_SIZE})
        
        response = requests.get(BASE_URL, headers=headers, params=params)
        response.raise_for_status() 
        first_data = response.json()
        
        total_results = first_data.get('TotalResults')
        results_list = first_data.get('Results')

        if total_results is None or not isinstance(results_list, list):
            print("ERRORE: La risposta API non ha i campi attesi.")
            return []
        
        all_boats_results.extend(results_list)
        print(f"TotalResults: {total_results}. Limite per richiesta: {PAGE_SIZE}")

        # Calcola pagine rimanenti
        num_remaining_pages = math.ceil(total_results / PAGE_SIZE) - 1
        
        # 2. Ciclo di paginazione
        for i in range(num_remaining_pages):
            current_start += PAGE_SIZE
            params_next = base_params.copy()
            params_next.update({'start': current_start, 'limit': PAGE_SIZE})
            
            print(f"   Recupero pagina {i + 2} di {num_remaining_pages + 1}... (Offset: {current_start})")
            
            response_next = requests.get(BASE_URL, headers=headers, params=params_next)
            response_next.raise_for_status()
            next_data = response_next.json()
            
            all_boats_results.extend(next_data.get('Results', []))
            
        print(f"✅ Download completato. Totale barche recuperate: **{len(all_boats_results)}**.")
        
        # Filter duplicates just in case
        unique_boats = []
        seen_ids = set()
        for boat in all_boats_results:
            bid = boat.get("BoatID")
            if bid and bid not in seen_ids:
                seen_ids.add(bid)
                unique_boats.append(boat)
        
        print(f"✅ Barche uniche: {len(unique_boats)}")
        
        if len(unique_boats) < count:
            return unique_boats
        return random.sample(unique_boats, count)

    except requests.exceptions.HTTPError as err:
        print(f"\n❌ ERRORE HTTP: {err}")
    except Exception as e:
        print(f"\n❌ Errore inaspettato: {e}")
    return []

def get_boat_details(boat_id):
    url = f"{BASE_URL}/{boat_id}"
    headers = {'Authorization': API_TOKEN, 'Accept': 'application/json'}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Errore API Dettagli: {e}")
        return None

def get_vat_label(vat_string):
    # Default: VAT Excluded if empty
    if not vat_string: return "VAT Excluded"
    vat_lower = vat_string.lower()
    
    # VAT Paid (Tasse Incluse)
    if any(x in vat_lower for x in ["inclusa", "incl.", "pagata"]):
        if "non pagata" not in vat_lower: # Exclude "non pagata"
            return "VAT Paid"
            
    # VAT Excluded (Tasse Escluse)
    if any(x in vat_lower for x in ["esclusa", "escl.", "esente", "esposta", "non pagata", "se dovuta"]):
        return "VAT Excluded"
        
    return "VAT Excluded"

def scarica_immagine(url):
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return Image.open(BytesIO(resp.content)).convert("RGB")
    except Exception as e:
        return None

def crea_carosello_settimanale(lista_barche_summary):
    if not lista_barche_summary: return

    dettagli_barche = []
    print("📡 Scaricando dettagli barche...")
    for b in lista_barche_summary:
        d = get_boat_details(b["BoatID"])
        if d: dettagli_barche.append(d)
    
    if not dettagli_barche: return

    # Setup Font
    try:
        font_cover_title = ImageFont.truetype(FONT_PATH, 130)
        font_cover_sub = ImageFont.truetype(FONT_PATH, 50)
        font_boat_name = ImageFont.truetype(FONT_PATH, 50) # Reduced from 65
        font_boat_price = ImageFont.truetype(FONT_PATH, 55)
        font_boat_vat = ImageFont.truetype(FONT_PATH, 30) # Font per VAT
        font_boat_specs = ImageFont.truetype(FONT_PATH, 40)
        font_footer = ImageFont.truetype(FONT_PATH, 25)
    except:
        font_cover_title = ImageFont.load_default()
        font_cover_sub = ImageFont.load_default()
        font_boat_name = ImageFont.load_default()
        font_boat_price = ImageFont.load_default()
        font_boat_vat = ImageFont.load_default()
        font_boat_specs = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    output_dir = f"carosello_selection_{SELECTION_NUMBER}"
    os.makedirs(output_dir, exist_ok=True)

    # --- SLIDE 1: COPERTINA ---
    print("🎨 Creazione Slide 1 (Copertina)...")
    cover_img_url = dettagli_barche[0].get("Images", [])[0].get("ImageUrl")
    if cover_img_url: cover_img_url += ".2048.jpg"
    cover_bg = scarica_immagine(cover_img_url)
    
    if cover_bg:
        cover_bg = ImageOps.fit(cover_bg, (W, H), centering=(0.5, 0.5))
        enhancer = ImageEnhance.Brightness(cover_bg)
        cover_bg = enhancer.enhance(0.4)
    else:
        cover_bg = Image.new('RGB', (W, H), color="#111111")

    canvas = cover_bg
    draw = ImageDraw.Draw(canvas)
    
    border_margin = 40
    draw.rectangle([border_margin, border_margin, W-border_margin, H-border_margin], outline="white", width=5)
    
    title = "BOATS\nSELECTION\nOF THE\nWEEK"
    draw.multiline_text((W/2, H/2), title, font=font_cover_title, fill="white", anchor="mm", align="center", spacing=30)
    
    sub = f"SELECTION #{SELECTION_NUMBER}"
    draw.text((W/2, H - 150), sub, font=font_cover_sub, fill="#DDDDDD", anchor="mm")
    
    canvas.save(f"{output_dir}/slide_1.jpg", quality=95)

    # --- SLIDE 2-7: BARCHE (New Design) ---
    for i, details in enumerate(dettagli_barche):
        print(f"🎨 Creazione Slide {i+2} ({details.get('Model')})...")
        
        builder = details.get("Builder", "").upper()
        model = details.get("Model", "").upper()
        price = details.get("SellPriceFormatted", "Price on request")
        vat_raw = details.get("SellPriceVAT", "")
        vat_label = get_vat_label(vat_raw)
        year = str(details.get("YearBuilt", "N/A"))
        length = f"{details.get('Length', 'N/A')}m"
        
        # Use Country for location
        location = details.get("Country", "Location N/A")
        if location and len(location) > 20: location = location.split(",")[0]
        
        # Broker Info
        agency_name = details.get("AgencyName", "Timone Yachts")
        agency_phone = details.get("AgencyPhone", "")
        
        canvas = Image.new('RGB', (W, H), color=COLORE_SFONDO)
        draw = ImageDraw.Draw(canvas)
        
        # 1. Image Area (Top 65%)
        img_h = int(H * 0.65)
        
        images_data = details.get("Images", [])
        images_to_show = images_data[:3]
        
        if images_to_show:
            pil_images = []
            for img_d in images_to_show:
                url = img_d.get("ImageUrl")
                if url:
                    url += ".2048.jpg"
                    p_img = scarica_immagine(url)
                    if p_img: pil_images.append(p_img)
            
            if pil_images:
                if len(pil_images) == 1:
                    img_resized = ImageOps.fit(pil_images[0], (W, img_h), centering=(0.5, 0.5))
                    canvas.paste(img_resized, (0, 0))
                elif len(pil_images) == 2:
                    h1 = img_h // 2
                    h2 = img_h - h1
                    i1 = ImageOps.fit(pil_images[0], (W, h1), centering=(0.5, 0.5))
                    i2 = ImageOps.fit(pil_images[1], (W, h2), centering=(0.5, 0.5))
                    canvas.paste(i1, (0, 0))
                    canvas.paste(i2, (0, h1))
                    draw.line([(0, h1), (W, h1)], fill="white", width=4)
                else:
                    h_main = int(img_h * 0.6)
                    h_sub = img_h - h_main
                    w_sub = W // 2
                    i_main = ImageOps.fit(pil_images[0], (W, h_main), centering=(0.5, 0.5))
                    canvas.paste(i_main, (0, 0))
                    i_sub1 = ImageOps.fit(pil_images[1], (w_sub, h_sub), centering=(0.5, 0.5))
                    canvas.paste(i_sub1, (0, h_main))
                    i_sub2 = ImageOps.fit(pil_images[2], (W - w_sub, h_sub), centering=(0.5, 0.5))
                    canvas.paste(i_sub2, (w_sub, h_main))
                    draw.line([(0, h_main), (W, h_main)], fill="white", width=4)
                    draw.line([(w_sub, h_main), (w_sub, img_h)], fill="white", width=4)

        # 2. Info Area (Bottom 35%)
        draw.rectangle([0, img_h, W, H], fill=COLORE_CARD)
        
        margin_x = 60
        cursor_y = img_h + 60
        
        # Force 2 lines: Builder on Line 1, Model on Line 2
        # Truncate each to ensure they fit in one line (approx 35 chars with smaller font)
        line1 = textwrap.shorten(builder, width=35, placeholder="...")
        line2 = textwrap.shorten(model, width=35, placeholder="...")
        title_lines = [line1, line2]
            
        for line in title_lines:
            draw.text((margin_x, cursor_y), line, font=font_boat_name, fill=COLORE_TESTO_TITOLO)
            cursor_y += 60 # Reduced spacing for smaller font
            
        # Fixed position for Specs
        specs_y = img_h + 60 + (2 * 60) + 20
        
        specs_text = f"{year}  •  {length}  •  {location}"
        draw.text((margin_x, specs_y), specs_text, font=font_boat_specs, fill=COLORE_TESTO_SPECS)
        
        # Price and VAT Alignment (Baseline)
        price_baseline_y = H - 120
        draw.text((margin_x, price_baseline_y), price, font=font_boat_price, fill=COLORE_TESTO_ACCENT, anchor="ls")
        
        if vat_label:
            bbox_p = draw.textbbox((0, 0), price, font=font_boat_price)
            w_p = bbox_p[2] - bbox_p[0]
            # Align VAT baseline with Price baseline
            draw.text((margin_x + w_p + 20, price_baseline_y), vat_label, font=font_boat_vat, fill="#666666", anchor="ls")
        
        # Broker Info
        broker_text = f"{agency_name}"
        if agency_phone: broker_text += f" • {agency_phone}"
        draw.text((margin_x, H - 40), broker_text, font=font_footer, fill="#999999", anchor="ls")
        
        draw.text((W - 200, H - 40), f"{i+1}/6 • Batoo.it", font=font_footer, fill="#999999", anchor="ls")
        
        canvas.save(f"{output_dir}/slide_{i+2}.jpg", quality=95)

if __name__ == "__main__":
    boats = get_best_boats(6)
    if boats:
        crea_carosello_settimanale(boats)
        print("\n✨ Carosello settimanale generato!")