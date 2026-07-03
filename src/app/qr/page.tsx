import QRCode from "qrcode";
import QRDownloadClient from "./QRDownloadClient";

const TARGET_URL = "https://www.aliice.app/";

export default async function QRPage() {
  // Generate high-res QR code as data URL (PNG, 600×600)
  const dataUrl = await QRCode.toDataURL(TARGET_URL, {
    width: 600,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });

  // Also generate SVG string for scalable download
  const svgString = await QRCode.toString(TARGET_URL, {
    type: "svg",
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });

  return <QRDownloadClient dataUrl={dataUrl} svgString={svgString} targetUrl={TARGET_URL} />;
}
