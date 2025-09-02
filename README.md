# Quality_Reporter

Otomatik kalite raporlama ve analizi icin gelistirilen Python paketi. 8D, A3,
Ishikawa, 5N1K ve DMAIC rapor metodlarindan birini secerek calisabilir.

## Kurulum

1. Bu depoyu klonlayin.
2. Opsiyonel olarak bir sanal ortam olusturun ve etkinlestirin:

```bash
python3 -m venv venv
source venv/bin/activate
```

3. Bagimliliklari kurmak icin asagidaki komutu calistirin:

```bash
pip install -r requirements.txt
pip install pre-commit
```

4. Git kancalarini kurmak icin `pre-commit install` komutunu calistirin:

```bash
pre-commit install
```

Bu adimlarin ardindan yapacaginiz her commit oncesinde `pre-commit` otomatik
calisacak ve kodunuzun sekilsel kontrolleri ile birim testleri gerceklestirilecektir.

Bu komut gerekli tüm Python bağımlılıklarını kurar.
Unicode karakterleri içeren PDF çıktısı alınabilmesi için depo kökünde bulunan
``Fonts`` klasöründeki ``DejaVuSans.ttf`` dosyası kullanılır. Dosya mevcut
değilse sistemdeki ``/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`` yolu
denenir.

Varsayılan olarak font aşağıdaki konumlarda aranır:

1. ``Fonts/DejaVuSans.ttf``
2. ``/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf``

## FONT_PATH Ortam Değişkeni

Uygulama PDF oluştururken varsayılan olarak yukarıdaki konumlardaki
``DejaVuSans.ttf`` dosyasını kullanır. Font bulunamazsa program hata verir.
Bu durumda ``FONT_PATH`` ortam değişkenini tanımlayarak farklı bir ``.ttf``
dosyası kullanabilirsiniz:

```bash
export FONT_PATH="/tam/yol/AlternatifFont.ttf"
```
Dosyayı indirdikten sonra bu değişkeni tanımlayıp uygulamayı
çalıştırmanız yeterlidir. Geçerli bir yol belirttiğinizde PDF işlemleri
bu font ile devam eder.
## OpenAI Anahtari

`LLMAnalyzer` sinifi OpenAI API'sini kullanir. Gercek bir sorgu icin
`OPENAI_API_KEY` ortam degiskenini asagidaki gibi tanimlayin veya ayni
isimli degiskeni `.env` dosyaniza ekleyin. Uygulama baslatildiginda dosya
varsa otomatik olarak yuklenir:

```bash
export OPENAI_API_KEY="sk-..."
```

Anahtari ve sikayet kaydi Excel dosyasinin yolunu kolayca tanimlamak icin
`configure_env.py` betigini calistirabilirsiniz. Betik istenen bilgileri
sorarak `.env` dosyasina yazar. Varsayilan ornek dosya
``CC/F160_Customer_Claims.xlsx`` konumunda bulunur.

```bash
python configure_env.py
```

Bu islemin ardindan `COMPLAINTS_XLSX_PATH` degiskeni de `.env` dosyaniza
eklenmis olur ve uygulama muster sikayetlerini bu dosyadan okur.

Dosya mevcut degilse `ExcelClaimsSearcher.search` bos liste dondurur ve loglara
bir uyari mesaji yazar.

Gecerli bir anahtar saglanmadiginda veya baglanti kurulamazsa analiz
sonuclari icin yer tutucu metinler dondurulur.

`OPENAI_MODEL` degiskenini `.env` dosyanizda ya da dogrudan ortamda
tanimlayarak kullanilacak model adini belirleyebilirsiniz. Deger
verilmezse varsayilan `gpt-3.5-turbo` kullanilir.

## Dizin Yapisi

Bu depoyu klonladiginizda klasorlerin amaclari kisaca su sekildedir:

```
/frontend   -> React (Vite)
/api        -> FastAPI code (currently in repo)
/electron   -> Electron config and build scripts
```

Kok dizindeki `run_api.py` dosyasi Electron tarafindan calistirilir ve API
sunucusunu baslatir. React derlenmis dosyalar `frontend/dist` altinda, paketlenmis
masaustu uygulamasi ise `electron/dist` klasorunde olusur.

## Modul Yapisi

Proje asagidaki paketleri icermektedir:

- `UI`: Kullanici arayuzu islemlerini yonetir.
- `GuideManager`: secilen rapor metodunun rehberini ve verilerini yonetir.
- `LLMAnalyzer`: Metinleri buyuk dil modeli kullanarak analiz eder.
- `Review`: Olusturulan rapor ya da analiz sonucunu gozden gecirir.
- `Comparison`: Iki veri kumesini veya raporu karsilastirir.
- `ReportGenerator`: Analiz sonucundan secilen metod icin rapor uretir.
- `ComplaintSearch`: Musteri sikayetlerini kaydeder ve arar.

Her paket icerisinde beklenen davranisi aciklayan siniflar yer almaktadir.

## Guidelines Klasoru

`Guidelines/` klasorunde 8D, A3, Ishikawa, 5N1K ve DMAIC metodlari icin
hazirlanmis JSON rehber dosyalari bulunur. `GuideManager.load_guide` fonksiyonuna
bu dosyalardan birinin yolunu vererek calismak istediginiz metodu secersiniz.
Ornegin `Guidelines/A3_Guide.json` yolunu kullanarak A3 metodunu secebilirsiniz.

`8D_Guide.json` dosyasi uygulamaya gomulu varsayilan rehber verisiyle eslenmistir.
Bu dosyayi silerseniz `GuideManager.get_format("8D")` yine calisir ve dahili
veriyi kullanir. Diger rehber dosyalari gomulu olmadigindan yerinde kalmalidir;
ornegin `Guidelines/A3_Guide.json` dosyasi yoksa ayni fonksiyon
`GuideNotFoundError` hatasi verir.

Rehber dosyalari artik duzenlenebilir hale gelmistir. `Guidelines/default`
klasoru varsayilan sablonlari saklar ve `POST /guide/{metot}/reset` ucu ya da
arayuzdeki kitap simgesi ile acilan duzenleyici uzerinden bu sablonlar geri
yuklenebilir. Yeni icerik `GuideManager.save_guide` fonksiyonuyla veya
`POST /guide/{metot}` cagrisiyla kaydedilebilir.

## Prompts Klasoru

`Prompts/` klasorunde her rapor metodu icin hazirlanmis duz metin sablonlari
bulunur. Bu dosyalar `*_Prompt.txt` adini tasir ve icerisinde buyuk dil
modeline gonderilecek tum metinler yer alir. Degiskenler cift suslu parantez
(`{{...}}`) seklinde belirtilir ve calisma sirasinda verilen bilgilerle
degistirilir.

Uygulamada `PromptManager.get_text_prompt("A3")` gibi bir cagriyla ilgili
sablon dosyasi okunur ve `LLMAnalyzer` tarafindan kullanilir. `8D` metodunun
varsayilan metni kod icinde tanimlidir; ancak `Prompts/8D_Prompt.txt` dosyasi
varsa bu dosya okunarak degistirilmis 8D promptu kullanilir.

### Sablonlari Ozellestirme

Sistemin urettigi ciktilari degistirmek icin bu metin dosyalarini dilediginiz
metin duzenleyiciyle acip icerigi guncelleyebilirsiniz. Gerekirse kendi metot
adinizla yeni bir `*_Prompt.txt` dosyasi ekleyip `PromptManager.get_text_prompt`
fonksiyonuna bu adi verebilirsiniz. Yer tutuculari korudugunuz surece metin
icerigini serbestce degistirerek rapor formatini ihtiyaciniza gore ozellestire
bilirsiniz.

Varsayilan sablonlar `Prompts/default/` altinda saklanir. Arayuzdeki not
simgesiyle acilan duzenleyici veya `POST /prompt/{metot}` ucu kullanilarak
metinler guncellenebilir. `POST /prompt/{metot}/reset` cagrisiyla dosya
icerigi varsayilan haline dondurulur.

## Kullanici Girdisi Akisi

Kullanicidan alinan veriler uygulama icinde asagidaki yollari izler:

1. **UI** kullanicidan metin veya dosya konumunu toplar.
2. **GuideManager** bu veriyi secilen metodun adimlariyla iliskilendirir.
3. **LLMAnalyzer** metni buyuk dil modeli araciligiyla yorumlar.
4. **Review** veya **Comparison** ihtiyaca gore analizi gozden gecirir.
5. **ReportGenerator** son raporu olusturarak diske yazar.

Bu surec asagidaki sekilde gosterilebilir:

```
[User] -> [UI] -> [GuideManager] -> [LLMAnalyzer] -> [ReportGenerator] -> PDF/Excel
```

## Ornek Kullanim


Paketleri kendi uygulamaniza dahil ederek asagidaki gibi kullanabilirsiniz:

```python
from UI import UI

ui = UI()
ui.start()
```

## API Sunucusu

`api` paketindeki FastAPI uygulamasi HTTP uzerinden ayni
islevlere erisim saglar. Sunucuyu calistirmak icin once bagimliliklari
kurun ve `run_api.py` dosyasini calistirin:

```bash
pip install -r requirements.txt
python run_api.py
```

Uygulama calisirken log seviyesini `LOG_LEVEL` degiskeniyle
belirleyebilirsiniz. Varsayilan seviye `INFO` olup ayrintili loglar
icin `LOG_LEVEL=DEBUG` tanimlayin.

Sunucu varsayilan olarak `http://localhost:8000` adresinde
asagidaki uclari sunar:

- `POST /analyze` – `LLMAnalyzer.analyze` cagrisi
- `POST /review` – `Review.perform` cagrisi
- `POST /report` – `ReportGenerator.generate` cagrisi
- `GET /complaints` – `ComplaintStore` ve `ExcelClaimsSearcher` sorgulari
- `POST /complaints` – yeni sikayet ekler
- `GET /guide/{method}` – secili metodun rehber adimlarini dondurur
- `POST /guide/{method}` – rehber icerigini gunceller
- `POST /guide/{method}/reset` – rehberi varsayilan sablona dondurur
- `GET /prompt/{method}` – metin promptunu dondurur
- `POST /prompt/{method}` – metin promptunu kaydeder
- `POST /prompt/{method}/reset` – promptu varsayilan sablona dondurur
- `GET /options/{field}` – Excel'deki benzersiz degerlerini dondurur ve
  dropdown menulerde kullanilir

Ornek kullanim:

```bash
curl -X POST http://localhost:8000/analyze \
     -H 'Content-Type: application/json' \
     -d '{"details": {"complaint": "test"}, "guideline": {"fields": []}}'

# rehber verisini cekmek
curl http://localhost:8000/guide/8D

# tum musterileri listelemek
curl http://localhost:8000/options/customer

# dinamik filtreleme ornegi
curl "http://localhost:8000/complaints?customer=ACME&part_code=X&year=2024"

# rapor olusturmak icin
curl -X POST http://localhost:8000/report \
     -H 'Content-Type: application/json' \
     -d '{"analysis": {}, "complaint_info": {"customer": "ACME", "subject": "Test", "part_code": "X"}}'
```

## React UI Calisma Akisi

React tabanli onyuzu calistirmak icin Node.js yüklü olmalidir.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Varsayilan ayar API'ye `http://localhost:8000` adresinden baglanir. API farkli
bir sunucuda veya portta calisiyorsa `.env` dosyasindaki `VITE_API_URL`
degerini bu adrese gore degistirin.

- `.env.example` dosyasini `.env` olarak kopyalayin.
- API baska bir sunucu veya portta calisiyorsa bu dosyadaki
  `VITE_API_URL` degerini guncelleyin.
- Bu degisken eksik ya da hatali ise arayuz API'den aldigi verileri
  gostermez.


> **Not:** Fishbone (Ishikawa) diyagramı özelliği şu anda React 19 ile
> uyumsuz olan `fishbone-chart` paketine bağlı olduğu için devre dışı
> bırakılmıştır. Uygun bir çözüm bulunduğunda yeniden etkinleştirilecektir.




**AnalysisForm** bileseni su alanlari zorunlu tutar:

- Complaint
- Customer
- Subject
- Part Code
- Method (8D, A3, Ishikawa, 5N1K veya DMAIC)
- Özel Talimatlar (opsiyonel)

Arayuz yeni bir tema ile kart tabanli tasarim sunar ve islemlerin durumu
icin toast bildirimleri gosterir. Tasarim responsive olup farkli ekran
genisliklerine uyum saglar ve istege bagli olarak acik ya da koyu mod
secenegi bulunur.

Form gonderildiginde sirayla `/analyze`, `/review` ve `/report`
uclari cagrilir. Donen nihai metin ekranda gorunur ve olusan PDF ile
Excel dosyalari icin indirme baglantilari saglanir.

**AnalysisForm** bileseni `GET /complaints` ucunu kullanarak
dinamik filtreleme yapar. Drop-down menulerdeki degerler
`/options/{field}` ucu ile doldurulur.

## Minimal Ornek

Asagidaki kod ornegi girdi akisini nasil kullanabileceginizi gosterir:

```python
from GuideManager import GuideManager
from LLMAnalyzer import LLMAnalyzer
from ReportGenerator import ReportGenerator

text = "musteri sikayet metni"

guide = GuideManager()
guideline = guide.get_format("8D")

analyzer = LLMAnalyzer()
details = {"complaint": text}
analysis = analyzer.analyze(details, guideline)
result_text = analysis["full_text"]

reporter = ReportGenerator(guide)
info = {"customer": "ACME", "subject": "Issue", "part_code": "X"}
paths = reporter.generate(analysis, info, "raporlar")
print("PDF yolu:", paths["pdf"])
print("Excel yolu:", paths["excel"])
print(result_text)
```

## Cikti Formatlari

`ReportGenerator.generate` fonksiyonu olusturulan PDF ve Excel dosyalarinin yolunu dondurur.

Simdilik siniflar sadece taslak niteligindedir ve gercek islevler icermemektedir.

## Testler

Testler `fpdf`, `openpyxl` ve `python-dotenv` gibi ek paketlere baglidir.
Bu kutuphaneler `requirements.txt` dosyasinda listelenmistir.
Katkida bulunacak gelistiriciler, testleri calistirmadan once asagidaki komutla tum bagimliliklari kurmalidir:

```bash
pip install -r requirements.txt
```

Bagimliliklari kurduktan sonra birim testlerini asagidaki komutla calistirabilirsiniz:

```bash
python -m unittest discover
```

Kod gondermeden once asagidaki komutla tum kancalari manuel olarak calistirarak
degisikliklerinizi dogrulayabilirsiniz:

```bash
pre-commit run --all-files
```

### Hizli Test Kurulumu

Testleri calistirmadan once `requirements.txt` dosyasindaki tum paketleri kurmaniz gerektigini unutmayin. Kurulum icin asagidaki betigi veya komutu kullanabilirsiniz:

```bash
scripts/setup_env.sh  # veya manual olarak
pip install -r requirements.txt
```

Kurulumun ardindan testleri calistirmak icin su komutu kullanin:

```bash
python -m unittest discover
```

Bir commit olusturmadan once `pre-commit` komutu calisarak kod formatinin dogru
oldugundan ve testlerin gectiginden emin olun:

```bash
pre-commit
```


## Frontend

React tabanli arayuzu calistirmak icin Node.js yüklu olmalidir. Ilk kurulumdan sonra
asagidaki komutlari calistirarak gelistirme sunucusunu baslatabilirsiniz:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Varsayilan ayar API'ye `http://localhost:8000` adresinden baglanir. API farkli
bir sunucuda veya portta calisiyorsa `.env` dosyasindaki `VITE_API_URL`
degerini buna gore degistirin.

- `.env.example` dosyasini `.env` olarak kopyalayin.
- API baska bir sunucuda veya portta calisiyorsa `VITE_API_URL`
  degerini guncelleyin.
- Yanlis ya da eksik bir API URL'si, arayuzun API'den veri cekip
  gostermesini engeller.

Baslik cubugunda yer alan kitap ve not simgeleri sirayla rehber ve prompt
duzenleyicilerini acar. Kaydet butonu degisiklikleri ilgili dosyalara yazar,
"Reset" secenegi ise `Guidelines/default` veya `Prompts/default` klasorlerindeki
varsayilan sablonlari geri yukler.

## Masaüstü Uygulama (Electron)

Uygulamanın masaüstü sürümünü üretmek için şu adımları izleyin:

1. React projesini `npm run build` komutuyla derleyin.
2. Python bağımlılıklarını bir sanal ortamda veya `pyinstaller` ile hazırlayın.
3. Ardından `cd electron && npm install && npm run dist` komutlarını çalıştırarak
   `setup.exe` dosyasını oluşturun.
4. Kurulumdan sonra masaüstündeki simgeye tıkladığınızda uygulama hemen
   başlar; terminal penceresi görmezsiniz.

## React UI Calisma Akisi

Arayuzdeki **AnalysisForm** bileşeni asagidaki alanlari zorunlu tutar:

- Complaint
- Customer
- Subject
- Part Code
- Method (8D, A3, Ishikawa, 5N1K veya DMAIC)
- Özel Talimatlar (opsiyonel)

Formu gonderdiginizde sirayla `/analyze`, `/review` ve `/report` uclari
cagrilir. Donen nihai metin ekranda gosterilir ve olusan PDF ile Excel
dosyalari icin indirme baglantilari saglanir.

**AnalysisForm** bileşeni `GET /complaints` ucunu kullanarak dinamik
filtreleme yapar. Sorguya yalnızca işaretli filtre kutularındaki alanlar
eklenir. Müşteri, Parça Kodu veya Konu seçiminden sonra ilgili kutuyu
işaretlemeyi (veya yıl filtresi seçmeyi) unutursanız arama parametresi
gönderilmez ve tablo boş dönebilir.

Onyuzu calistirmak icin yukaridaki komutlardan sonra tarayicinizda
`http://localhost:5173` adresini acabilirsiniz. Arayuz API'ye 8000
portundan baglanir.

Arayuz yeni bir tema ile kart tabanli tasarim kullanacak sekilde
guncellenmistir. Hata mesajlari MUI `Alert` bilesenleriyle
goruntulenir. Toast/snackbar bildirimleri ileride eklenebilir.
Tasarim responsive olup farkli ekran genisliklerine uyum saglar ve
istege bagli olarak acik veya koyu mod secilebilir.
