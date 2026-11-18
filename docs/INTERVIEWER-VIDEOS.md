# Video interviewer (Mock Interview)

Dalam video call Mock Interview, interviewer boleh dipaparkan sebagai **video orang sebenar** (dijana AI) dan bukan avatar kartun. Sistem tukar klip ikut keadaan interviewer:

| Keadaan | Bila dimainkan | Fail |
|---|---|---|
| Menunggu | Antara soalan, mod Type/Upload | `idle.mp4` |
| Bercakap | Semasa membaca soalan (suara dari browser) | `speaking.mp4` |
| Mendengar | Semasa anda menjawab | `listening.mp4` |
| Berfikir (pilihan) | Semasa skor dikira | `thinking.mp4` |

Cukup dengan `idle.mp4` untuk video mula dipaparkan. Keadaan yang belum ada klipnya akan memainkan `idle.mp4`. Selagi `idle.mp4` belum ada, avatar kartun dipaparkan. Tiada apa-apa rosak.

## Di mana letak fail

```
public/interviewers/
├── aisyah/     Aisyah (friendly)
├── faiz/       Encik Faiz (strict)
└── meiling/    Ms. Mei Ling (neutral)
```

Contoh: `public/interviewers/aisyah/speaking.mp4`. Muat semula halaman selepas meletak fail.

## Spesifikasi klip

- **Format:** MP4 (H.264), tanpa audio.
- **Saiz:** 1280×720 (16:9). Muka di tengah, dari dada ke atas, ruang sedikit di atas kepala. Kotak video memotong tepi, jadi jangan letak muka terlalu ke tepi.
- **Panjang:** 5 hingga 10 saat. **Gelung lancar**: kedudukan badan di saat terakhir sama dengan saat pertama.
- **Berat fail:** bawah 3 MB setiap satu.
- **Latar:** pejabat kabur (blur), cahaya lembut, warna neutral.
- **Watak sama** dalam keempat-empat klip (pakaian, rambut, latar, cahaya).

Mampatkan dan buang audio dengan ffmpeg:

```bash
ffmpeg -i input.mp4 -an -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" -c:v libx264 -crf 28 -preset slow -movflags +faststart speaking.mp4
```

## Cara menjana (cadangan)

1. **Jana satu gambar potret** setiap interviewer dengan alat imej AI (contoh: Midjourney, Ideogram, Gemini, ChatGPT). Guna prompt watak di bawah.
2. **Hidupkan gambar itu** dengan alat image-to-video (contoh: Kling, Runway, Hailuo, Pika) menggunakan prompt pergerakan di bawah. Guna gambar yang **sama** untuk keempat-empat klip supaya watak konsisten.
3. Untuk `speaking.mp4`, alat avatar bercakap (contoh: HeyGen, D-ID) juga sesuai: muat naik gambar, beri ayat neutral, kemudian buang audio.
4. Mampatkan dengan arahan ffmpeg di atas, letak dalam folder yang betul.

> Guna **wajah yang dijana AI**, bukan wajah orang sebenar. Jika guna rakaman kawan, dapatkan izin mereka. Label "AI interviewer" sentiasa dipaparkan pada video.

### Prompt watak (gambar potret)

**Aisyah**
> Photorealistic portrait of a friendly Malaysian Malay woman in her late 20s, HR manager, wearing a soft grey hijab and a teal blouse, warm natural smile, sitting at a desk facing the camera, chest-up framing, centred, blurred modern office background, soft daylight, video-call webcam look, 16:9

**Encik Faiz**
> Photorealistic portrait of a Malaysian Malay man in his early 40s, senior tech lead, short neat hair, thin-rimmed glasses, navy collared shirt, calm serious expression, sitting at a desk facing the camera, chest-up framing, centred, blurred office background with monitors, soft daylight, video-call webcam look, 16:9

**Ms. Mei Ling**
> Photorealistic portrait of a Malaysian Chinese woman in her mid 40s, senior manager, shoulder-length black hair, dark blazer over a white top, calm composed expression, sitting at a desk facing the camera, chest-up framing, centred, blurred meeting-room background, soft daylight, video-call webcam look, 16:9

### Prompt pergerakan (image-to-video)

Tambah di hujung setiap prompt: *"Static camera, no zoom, no cuts, same pose at the start and end so it loops seamlessly, no text."*

| Fail | Prompt |
|---|---|
| `idle.mp4` | The person sits still and waits politely, small natural breathing movement, blinks a few times, a gentle smile, looks at the camera. |
| `speaking.mp4` | The person is talking to the camera in a calm professional tone, natural lip movement, small head movements and an occasional hand gesture near the chest, keeps eye contact. |
| `listening.mp4` | The person listens attentively to someone speaking, nods slowly once or twice, small attentive expressions, keeps eye contact, mouth closed. |
| `thinking.mp4` | The person looks slightly down and to the side as if reading notes, then back at the camera, mouth closed. |

## Kod berkaitan

- `resources/js/modules/m3-mock-interview/components/avatar/InterviewerVideo.tsx`: semak fail, mainkan klip ikut keadaan, sandaran avatar kartun.
- `resources/js/modules/m3-mock-interview/services/personas.ts`: `videoDir` untuk setiap interviewer.
- `resources/js/modules/m3-mock-interview/components/room/VideoStage.tsx`: kotak interviewer dalam video call.
