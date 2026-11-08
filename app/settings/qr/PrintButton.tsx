"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden fixed bottom-6 right-6 px-6 py-3 rounded-xl font-bold shadow-xl"
      style={{ background: "#c8f060", color: "#0a0a0a" }}
    >
      Yazdır / PDF Kaydet
    </button>
  );
}
