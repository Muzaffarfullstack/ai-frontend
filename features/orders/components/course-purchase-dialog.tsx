"use client";

import { useState, type FormEvent } from "react";
import { formatMoney, type Course, type PaymentMode } from "@/lib/api-client";

interface CoursePurchaseDialogProps {
  course: Course;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (paymentMode: PaymentMode, contactAdmin: boolean) => Promise<void> | void;
}

export function CoursePurchaseDialog({ course, busy, error, onClose, onSubmit }: CoursePurchaseDialogProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("full");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(paymentMode, false);
  }

  return <div className="payment-modal-backdrop" role="presentation" onMouseDown={(event) => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <section className="payment-instructions-modal purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-dialog-title">
      <header><div><span className="eyebrow">KURSNI SOTIB OLISH</span><h2 id="purchase-dialog-title">To‘lov usulini tanlang</h2></div><button type="button" aria-label="Yopish" disabled={busy} onClick={onClose}>×</button></header>
      <p className="admin-muted"><b>{course.title}</b> · {formatMoney(course.price, course.currency)}</p>
      <form onSubmit={submit}>
        <fieldset className="purchase-mode-options">
          <legend>Qanday to‘laysiz?</legend>
          <label className={paymentMode === "full" ? "active" : ""}><input type="radio" name="payment_mode" value="full" checked={paymentMode === "full"} onChange={() => setPaymentMode("full")}/><span><b>Birdaniga to‘lash</b><small>To‘liq summa bir marta to‘lanadi va barcha qismlar ochiladi.</small></span></label>
          <label className={paymentMode === "installment_3" ? "active" : ""}><input type="radio" name="payment_mode" value="installment_3" checked={paymentMode === "installment_3"} onChange={() => setPaymentMode("installment_3")}/><span><b>3 bo‘lib to‘lash</b><small>Har bir to‘lov tasdiqlangach kursning navbatdagi qismi ochiladi.</small></span></label>
        </fieldset>
        {error && <div className="form-error">{error}</div>}
        <div className="purchase-dialog-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Yuborilmoqda…" : "So‘rov yuborish"}</button><button className="button button-ghost" type="button" disabled={busy} onClick={() => void onSubmit(paymentMode, true)}>Admin men bilan bog‘lansin</button></div>
      </form>
      <p className="purchase-dialog-note">Admin siz tanlagan to‘lov usuliga mos reja va rekvizitlarni biriktiradi.</p>
    </section>
  </div>;
}
