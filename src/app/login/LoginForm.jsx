'use client'
// 'use client' WAJIB ada di baris paling atas file, karena komponen ini
// akan memakai useState & useRef (fitur interaktif) di STEP 3 - fitur ini
// hanya boleh jalan di "Client Component", bukan "Server Component" bawaan
// Next.js App Router.

import React, { useRef, useState } from 'react'

/* =====================================================================
   CARA PAKAI FILE INI
   =====================================================================
   Ada 3 STEP di komponen ini:

   STEP 1 (STRUKTUR JSX) -
    AKTIF dari awal. Cuma menampilkan form polos
    tanpa gaya visual dan tanpa fungsi apa pun.

   STEP 2 (STYLE) - 
    Cari blok <style jsx> di bagian BAWAH,
    di dalam komentar JSX. Hapus pembuka di sekitarnya.
    Next.js punya dukungan bawaan untuk styled - jsx ini,
    jadi TIDAK perlu install package apa pun.

    STEP 3(LOGIC) -
    Ada di 2 tempat yang harus diubah bersamaan:
    a) Uncomment blok besar di ATAS 'return' ini
    (deklarasi useRef, useState, handleSubmit).
    b) Edit manual 3 baris di dalam JSX(return):
    - Tambahkan  onSubmit = { handleSubmit }ke tag < form >
    - Tambahkan  ref = { emailRef } ke < input id = "email" >
    - Tambahkan  ref = { passwordRef } ke < input id = "password" >
    - Ganti < p className = "message" ></p > menjadi:
    <p className={`message ${message.type}`}>{message.text}</p>
    Bagian(b) TIDAK bisa cuma di - uncomment karena
    atribut seperti onSubmit / ref akan error kalau
    variabelnya(handleSubmit / emailRef) belum
    dideklarasikan - makanya harus 2 langkah.
    Kredensial uji coba di STEP 3: admin @mail.com / admin123
    ===================================================================== */

const LoginForm = () => {
    const emailRef = useRef(null)
    const passwordRef = useRef(null)
    const [message, setMessage] = useState({ text: '', type: '' })

    const VALID_EMAIL = 'admin@mail.com'
    const VALID_PASSWORD = 'admin123'

    const handleSubmit = (e) => {
      e.preventDefault() // mencegah reload halaman (perilaku default form)

      const emailValue = emailRef.current.value.trim()
      const passwordValue = passwordRef.current.value

      if (emailValue === VALID_EMAIL && passwordValue === VALID_PASSWORD) {
        setMessage({
          text: `Login berhasil! Selamat datang, ${emailValue}`,
          type: 'success',
        })
      } else {
        setMessage({ text: 'Email atau password salah.', type: 'error' })
      }
    }
  

    return (
        <div className="login-container">
            <h1>Halaman Login</h1>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="text"
                        id="email"
                        name="email"
                        placeholder="Masukkan email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Masukkan password"
                    />
                </div>

                <button type="submit" className="btn-login">
                    Login
                </button>
            </form>

            <p className="message">{message.text}</p>

      <style jsx>{`
        .login-container {
          background-color: #ffffff;
          padding: 32px 28px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 360px;
          margin: 80px auto;
          font-family: Arial, Helvetica, sans-serif;
        }

        .login-container h1 {
          margin-top: 0;
          margin-bottom: 24px;
          font-size: 22px;
          text-align: center;
          color: #1a1a1a;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          color: #333333;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cccccc;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #4a90e2;
        }

        .btn-login {
          width: 100%;
          padding: 10px;
          background-color: #4a90e2;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          font-size: 15px;
          cursor: pointer;
          margin-top: 8px;
        }

        .btn-login:hover {
          background-color: #3a7bc8;
        }

        .message {
          margin-top: 16px;
          text-align: center;
          font-size: 14px;
          min-height: 18px;
        }

        .message.success {
          color: #2e7d32;
        }

        .message.error {
          color: #c62828;
        }
      `}</style>
        </div>
    )
}

export default LoginForm