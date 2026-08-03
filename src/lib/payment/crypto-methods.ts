// Single source of truth cho 7 phương thức thanh toán crypto hiển thị ở
// trang /[locale]/payment/[orderNumber] khi locale != 'vi'.
//
// Quy ước:
// - kind = "exchange": Binance Pay / Bybit Pay - khách scan QR trong app
//   sàn, KHÔNG cần network. Có Pay-ID dạng số + tên tài khoản hiển thị.
// - kind = "onchain":  Khách chuyển on-chain (BSC/TRX/BTC/ETH/LTC). BẮT
//   BUỘC hiển thị `network` rõ ràng và cảnh báo "chỉ gửi đúng mạng" để
//   tránh khách mất tiền vì sai network.
//
// Khi đổi địa chỉ ví / Pay-ID, chỉ cần sửa file này (KHÔNG đụng UI).

export type CryptoExchangeMethod = {
  kind: "exchange";
  id: "binance" | "bybit";
  label: string; // hiển thị trên tab + tiêu đề panel
  payId: string; // Pay-ID dạng số mà khách nhập trong app
  accountName: string;
  qr: string; // path tương đối với public/
  appLabel: string; // dùng cho i18n message "scanWithApp"
};

export type CryptoOnchainMethod = {
  kind: "onchain";
  id: "usdt-bep20" | "usdt-trc20" | "btc" | "eth" | "ltc";
  label: string;
  asset: "USDT" | "BTC" | "ETH" | "LTC";
  network: string; // hiển thị raw cho khách
  address: string;
  qr: string;
};

export type CryptoMethod = CryptoExchangeMethod | CryptoOnchainMethod;

export const CRYPTO_METHODS: CryptoMethod[] = [
  {
    kind: "exchange",
    id: "binance",
    label: "Binance Pay",
    payId: "472468886",
    accountName: "PHAN LE VAN MINH",
    qr: "/payment/binance-pay-qr.png",
    appLabel: "Binance",
  },
  {
    kind: "exchange",
    id: "bybit",
    label: "Bybit Pay",
    payId: "539036177",
    accountName: "PHAN LE VAN MINH",
    qr: "/payment/bybit-pay-qr.png",
    appLabel: "Bybit",
  },
  {
    kind: "onchain",
    id: "usdt-bep20",
    label: "USDT (BEP20)",
    asset: "USDT",
    network: "BSC / BEP20",
    address: "0xe82911021df394dd82ba74ba6ea96f3501c5a021",
    qr: "/payment/usdt-bep20-qr.png",
  },
  {
    kind: "onchain",
    id: "usdt-trc20",
    label: "USDT (TRC20)",
    asset: "USDT",
    network: "TRON / TRC20",
    address: "TL5afyPacjbn3kAgAHGyfMfTKd1SCvvE29",
    qr: "/payment/usdt-trc20-qr.png",
  },
  {
    kind: "onchain",
    id: "btc",
    label: "Bitcoin",
    asset: "BTC",
    network: "BTC",
    address: "15j37aEd1HMTp9pvUAch81ZJQ57brGmPta",
    qr: "/payment/btc-qr.png",
  },
  {
    kind: "onchain",
    id: "eth",
    label: "Ethereum",
    asset: "ETH",
    network: "ETH / ERC20",
    address: "0xe82911021df394dd82ba74ba6ea96f3501c5a021",
    qr: "/payment/eth-qr.png",
  },
  {
    kind: "onchain",
    id: "ltc",
    label: "Litecoin",
    asset: "LTC",
    network: "LTC",
    address: "LcN2PesE52PYrfawRyykcnhCgrRZKMiZ9b",
    qr: "/payment/ltc-qr.png",
  },
];

export const DEFAULT_CRYPTO_METHOD_ID: CryptoMethod["id"] = "binance";
