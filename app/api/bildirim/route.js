// app/api/bildirim/route.js
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { adSoyad, telefon, adet, yontem } = body;

        // E-postayı atacak sistem (Senin Gmail'in)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        // Mailin içeriği
        const mailOptions = {
            from: `"Ramazan Kumanyası" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Kendine gönderiyorsun (istersen buraya baska mail de yazabilirsin)
            subject: `🚨 YENİ BAĞIŞ ONAYI: ${adSoyad} (${yontem})`,
            text: `Sistemde onayınızı bekleyen yeni bir bağış var!\n\n` +
                  `İSİM: ${adSoyad}\n` +
                  `TELEFON: ${telefon}\n` +
                  `ADET: ${adet} Paket\n` +
                  `YÖNTEM: ${yontem}\n\n` +
                  `Hemen incelemek ve onaylamak için yönetim paneline gidin:\n` +
                  `https://ramazan-kumanya.vercel.app/admin`
        };

        // Maili gönder
        await transporter.sendMail(mailOptions);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mail gönderme hatası:", error);
        return NextResponse.json({ error: "Mail gönderilemedi" }, { status: 500 });
    }
}