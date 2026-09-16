/* =====================================================================
   STEP 0: STRUKTUR KOMPONEN (Konsep dasar React/Next.js)
   =====================================================================
   Ini contoh konsep PALING dasar di React: satu halaman (page) bisa
   dipecah jadi komponen-komponen kecil yang terpisah filenya, lalu
   di-"pasang" lagi lewat import - seperti menyusun lego.

   Di bawah ini, import dan pemakaian <LoginForm /> sengaja DI-COMMENT
   dulu. Uncomment KEDUA baris berikut (baris import di atas, dan baris
   <LoginForm /> di dalam return) untuk menghubungkan halaman ini dengan
   komponen form login yang ada di file LoginForm.jsx.
   ===================================================================== */

import React from 'react'
import LoginForm from './LoginForm'

const Page = () => {
    return (
        <div>
            {/* page */}
            <LoginForm />
        </div>
    )
}

export default Page