import { ImageResponse } from 'next/og';

// Senin Firebase Proje ID'ni buraya yaz (firebase.js içindeki projectId)
const PROJECT_ID = "interaktif-dijital-afis"; 

export const runtime = 'edge';
export const alt = 'Ramazan Kumanyası';
export const contentType = 'image/png';

export default async function Image() {
  // 1. Veriyi Firebase'den çek (REST API ile)
  // Bu yöntem Edge sunucularında en hızlı ve hatasız yöntemdir.
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/ayarlar/genel`, {
    next: { revalidate: 0 } // Her seferinde taze veri çek
  });
  
  const json = await res.json();
  
  // Veritabanından gelen verileri al (Eğer veri yoksa 0 varsay)
  const fields = json.fields || {};
  const toplanan = fields.toplananSayi ? Number(fields.toplananSayi.integerValue || fields.toplananSayi.doubleValue) : 0;
  const hedef = fields.hedefSayi ? Number(fields.hedefSayi.integerValue || fields.hedefSayi.doubleValue) : 2000;
  
  // Yüzde hesabı
  const yuzde = Math.min(((toplanan / hedef) * 100).toFixed(0), 100);

  // 2. Resmi Kodla Çiz (HTML/CSS benzeri yapı)
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f5f0', // Krem rengi arka plan
          fontFamily: 'sans-serif',
        }}
      >
        {/* Arka Plan Süsü */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)' }}></div>
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)' }}></div>

        {/* Başlık */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
             <h1 style={{ fontSize: '60px', fontWeight: '900', color: '#78350f', margin: '0', lineHeight: '1' }}>RAMAZAN</h1>
             <h1 style={{ fontSize: '60px', fontWeight: '900', color: '#78350f', margin: '0', lineHeight: '1' }}>KUMANYASI</h1>
        </div>

        {/* İlerleme Durumu */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '2px solid #fef3c7' }}>
            
            <div style={{ fontSize: '24px', color: '#92400e', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Hedefe Ulaşım</div>
            
            {/* Progress Bar Çizimi */}
            <div style={{ width: '600px', height: '40px', background: '#e5e7eb', borderRadius: '20px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${yuzde}%`, height: '100%', background: '#f59e0b', display: 'flex' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '600px', marginTop: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '50px', fontWeight: 'bold', color: '#d97706' }}>{toplanan}</span>
                    <span style={{ fontSize: '20px', color: '#6b7280' }}>TOPLANAN</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '50px', fontWeight: 'bold', color: '#d1d5db' }}>{hedef}</span>
                    <span style={{ fontSize: '20px', color: '#9ca3af' }}>HEDEF</span>
                </div>
            </div>
        </div>

        <div style={{ marginTop: '40px', fontSize: '28px', color: '#92400e', fontWeight: 'bold', background: '#fef3c7', padding: '10px 30px', borderRadius: '50px' }}>
            Bir Ailenin Sofrasına Ortak Ol
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}