import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, QrCode as QrIcon, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/formatters.js';

export default function QrPaymentModal({
  isOpen,
  onClose,
  settlement,
  onMarkPaid
}) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [generatedQr, setGeneratedQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    if (isOpen && settlement?.toMemberUpiId) {
      // If member has uploaded custom QR image, we prioritize showing their uploaded QR.
      // Additionally, we generate the dynamic UPI QR code with amount prefilled.
      setLoadingQr(true);
      const url = `/api/generate-upi-qr?upiId=${encodeURIComponent(settlement.toMemberUpiId)}&name=${encodeURIComponent(settlement.toMemberName)}&amount=${settlement.amountRupees}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setGeneratedQr(data.qrDataUrl);
          }
        })
        .catch(err => console.error('Failed to generate dynamic UPI QR:', err))
        .finally(() => setLoadingQr(false));
    }
  }, [isOpen, settlement]);

  if (!isOpen || !settlement) return null;

  const copyUpiId = () => {
    if (!settlement.toMemberUpiId) return;
    navigator.clipboard.writeText(settlement.toMemberUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(String(settlement.amountRupees));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const qrToDisplay = settlement.toMemberQrImage || generatedQr;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <QrIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pay to {settlement.toMemberName}
              </h3>
              <p className="text-[11px] text-slate-500">Scan & Pay via any UPI App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-center">
          {/* Amount Badge */}
          <div className="py-2 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">
                Amount to Pay
              </span>
              <span className="text-2xl font-black text-slate-900">
                {formatINR(settlement.amountRupees)}
              </span>
            </div>
            <button
              onClick={copyAmount}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition"
              title="Copy Amount"
            >
              {copiedAmount ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* QR Code Container */}
          <div className="relative mx-auto w-56 h-56 p-3 bg-white border-2 border-dashed border-slate-200 rounded-3xl shadow-xs flex items-center justify-center">
            {loadingQr ? (
              <div className="text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Generating UPI QR...</span>
              </div>
            ) : qrToDisplay ? (
              <img
                src={qrToDisplay}
                alt={`${settlement.toMemberName}'s UPI QR Code`}
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <div className="text-xs text-slate-400 px-4">
                No custom QR uploaded. Please use the UPI ID below.
              </div>
            )}
          </div>

          {/* Receiver details */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Receiver Name</span>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{settlement.toMemberAvatar || '👤'}</span>
                <span>{settlement.toMemberName}</span>
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-xs text-slate-500">UPI ID</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-800">
                  {settlement.toMemberUpiId || 'Not provided'}
                </span>
                {settlement.toMemberUpiId && (
                  <button
                    onClick={copyUpiId}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {/* Direct UPI Deep Link */}
            <a
              href={settlement.upiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-brand-600/30 active:scale-[0.99] transition text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Pay {formatINR(settlement.amountRupees)} via UPI</span>
            </a>

            {/* Mark as paid button */}
            {settlement.status !== 'paid' && onMarkPaid && (
              <button
                onClick={() => {
                  onMarkPaid(settlement.id, 'paid');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-2xl border border-emerald-200 transition text-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mark as Paid</span>
              </button>
            )}
          </div>

          {/* Security Disclaimer Banner */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>100% Safe:</strong> RoomHisaab never asks for your UPI PIN, OTP, or passwords. Payment is completed securely within your bank's UPI app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
