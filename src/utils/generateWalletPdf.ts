import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Species, type CarteiraDigitalResponseDto } from '@petcardorg/shared';

import { calculateAge } from './calculateAge';
import { getPhotoUrl, SEX_CONFIG, SPECIES_CONFIG } from './petConfig';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Lançada quando o dispositivo não tem como compartilhar/salvar o arquivo gerado. */
export const SHARING_UNAVAILABLE = 'sharing-unavailable';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCount(value: number | null): string {
  return value == null ? '—' : String(value);
}

function row(label: string, value: string): string {
  return `<tr><td class="label">${escapeHtml(label)}</td><td class="value">${escapeHtml(
    value,
  )}</td></tr>`;
}

/**
 * Monta o HTML da carteira digital para impressão/exportação em PDF (RF12).
 * Usa exatamente os mesmos dados exibidos na tela (snapshot do momento da emissão).
 */
function buildWalletHtml(wallet: CarteiraDigitalResponseDto, t: Translate): string {
  const species = SPECIES_CONFIG[wallet.species] ?? SPECIES_CONFIG[Species.OTHER];
  const sex = SEX_CONFIG[wallet.sex];
  const age = calculateAge(wallet.birth_date);
  const photoUrl = getPhotoUrl(wallet);
  const generatedAt = new Date().toLocaleString();

  const identityRows = [
    row(t('digitalWallet.pdf.fields.name'), wallet.pet_name),
    wallet.breed ? row(t('digitalWallet.pdf.fields.breed'), wallet.breed) : '',
    row(t('digitalWallet.pdf.fields.species'), species.label),
    row(t('digitalWallet.pdf.fields.sex'), sex.label),
    row(t('digitalWallet.age'), age),
    wallet.weight != null ? row(t('digitalWallet.weight'), `${wallet.weight} kg`) : '',
  ].join('');

  const summaryRows = [
    row(
      t('digitalWallet.summary.vaccines'),
      `${formatCount(wallet.vaccines_count)} (${formatCount(
        wallet.upcoming_vaccines_count,
      )} ${t('digitalWallet.summary.withNextDose')})`,
    ),
    row(
      t('digitalWallet.summary.dewormings'),
      `${formatCount(wallet.dewormings_count)} (${formatCount(
        wallet.upcoming_dewormings_count,
      )} ${t('digitalWallet.summary.withNextDose')})`,
    ),
    row(
      t('digitalWallet.summary.medications'),
      `${formatCount(wallet.medications_count)} (${formatCount(
        wallet.active_medications_count,
      )} ${t('digitalWallet.summary.active')})`,
    ),
  ].join('');

  const photoBlock = photoUrl
    ? `<img class="photo" src="${escapeHtml(photoUrl)}" alt="" />`
    : '<div class="photo placeholder"></div>';

  const qrBlock = wallet.qr_code_url
    ? `<div class="qr-wrap">
         <img class="qr" src="${escapeHtml(wallet.qr_code_url)}" alt="" />
       </div>`
    : '';

  const linkBlock = wallet.public_url
    ? `<p class="link"><span class="label">${escapeHtml(
        t('digitalWallet.pdf.linkLabel'),
      )}:</span> ${escapeHtml(wallet.public_url)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, Helvetica, Arial, sans-serif;
        color: #1f2430;
        margin: 0;
        padding: 32px;
      }
      .brand { font-size: 13px; letter-spacing: 1px; color: #2f7a6b; font-weight: 700; }
      h1 { font-size: 22px; margin: 4px 0 24px; }
      .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
      .photo { width: 96px; height: 96px; border-radius: 12px; object-fit: cover; border: 1px solid #e3e7ef; }
      .photo.placeholder { background: #eef1f6; }
      h2 { font-size: 15px; margin: 24px 0 8px; color: #2f7a6b; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 8px 0; border-bottom: 1px solid #eef1f6; font-size: 14px; vertical-align: top; }
      td.label { color: #6b7280; width: 45%; }
      td.value { color: #1f2430; font-weight: 600; }
      .qr-wrap { text-align: center; margin: 16px 0; }
      .qr { width: 180px; height: 180px; }
      .link { font-size: 12px; color: #374151; word-break: break-all; }
      .link .label { color: #6b7280; font-weight: 600; }
      .footer { margin-top: 32px; font-size: 11px; color: #9aa1ad; border-top: 1px solid #eef1f6; padding-top: 12px; }
    </style>
  </head>
  <body>
    <div class="brand">PetCard</div>
    <h1>${escapeHtml(t('digitalWallet.pdf.docTitle'))}</h1>

    <div class="header">
      ${photoBlock}
      <div>
        <div style="font-size:20px;font-weight:700;">${escapeHtml(wallet.pet_name)}</div>
        ${wallet.breed ? `<div style="color:#6b7280;">${escapeHtml(wallet.breed)}</div>` : ''}
      </div>
    </div>

    <h2>${escapeHtml(t('digitalWallet.pdf.identityTitle'))}</h2>
    <table>${identityRows}</table>

    <h2>${escapeHtml(t('digitalWallet.summary.title'))}</h2>
    <table>${summaryRows}</table>

    ${
      wallet.qr_code_url || wallet.public_url
        ? `<h2>${escapeHtml(t('digitalWallet.qrSection.title'))}</h2>${qrBlock}${linkBlock}`
        : ''
    }

    <div class="footer">
      ${escapeHtml(t('digitalWallet.pdf.footerNote'))}<br />
      ${escapeHtml(t('digitalWallet.pdf.generatedAtLabel'))}: ${escapeHtml(generatedAt)}
    </div>
  </body>
</html>`;
}

/**
 * Gera o PDF da carteira digital e abre o diálogo de compartilhamento/salvamento (RF12).
 * Lança `Error(SHARING_UNAVAILABLE)` quando o dispositivo não suporta compartilhamento.
 */
export async function exportWalletPdf(
  wallet: CarteiraDigitalResponseDto,
  t: Translate,
): Promise<void> {
  const html = buildWalletHtml(wallet, t);
  const { uri } = await Print.printToFileAsync({ html });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(SHARING_UNAVAILABLE);
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: t('digitalWallet.actions.exportPdfDialog', { petName: wallet.pet_name }),
    UTI: 'com.adobe.pdf',
  });
}
