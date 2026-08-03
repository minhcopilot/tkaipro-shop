export interface VietQrBank {
  /** Mã BIN dùng trong URL VietQR, vd 970423 */
  bin: string;
  /** Mã viết tắt VietQR, vd TPB, VCB */
  code: string;
  /** Nhãn đầy đủ: (970423) TPBank */
  label: string;
  /** Tên hiển thị ngân hàng */
  name: string;
}

function bank(code: string, bin: string, name: string): VietQrBank {
  return { bin, code, label: `(${bin}) ${name}`, name };
}

/** Danh sách ngân hàng chính thức VietQR */
export const VIETQR_BANKS: VietQrBank[] = [
  bank("ICB", "970415", "VietinBank"),
  bank("VCB", "970436", "Vietcombank"),
  bank("BIDV", "970418", "BIDV"),
  bank("VBA", "970405", "Agribank"),
  bank("OCB", "970448", "OCB"),
  bank("MB", "970422", "MBBank"),
  bank("TCB", "970407", "Techcombank"),
  bank("ACB", "970416", "ACB"),
  bank("VPB", "970432", "VPBank"),
  bank("TPB", "970423", "TPBank"),
  bank("STB", "970403", "Sacombank"),
  bank("HDB", "970437", "HDBank"),
  bank("VCCB", "970454", "VietCapitalBank"),
  bank("SCB", "970429", "SCB"),
  bank("VIB", "970441", "VIB"),
  bank("SHB", "970443", "SHB"),
  bank("EIB", "970431", "Eximbank"),
  bank("MSB", "970426", "MSB"),
  bank("CAKE", "546034", "CAKE"),
  bank("Ubank", "546035", "Ubank"),
  bank("VTLMONEY", "971005", "ViettelMoney"),
  bank("TIMO", "963388", "Timo"),
  bank("VNPTMONEY", "971011", "VNPTMoney"),
  bank("SGICB", "970400", "SaigonBank"),
  bank("BAB", "970409", "BacABank"),
  bank("momo", "971025", "MoMo"),
  bank("PVDB", "971133", "PVcomBank Pay"),
  bank("PVCB", "970412", "PVcomBank"),
  bank("MBV", "970414", "MBV"),
  bank("NCB", "970419", "NCB"),
  bank("SHBVN", "970424", "ShinhanBank"),
  bank("ABB", "970425", "ABBANK"),
  bank("VAB", "970427", "VietABank"),
  bank("NAB", "970428", "NamABank"),
  bank("PGB", "970430", "PGBank"),
  bank("VIETBANK", "970433", "VietBank"),
  bank("BVB", "970438", "BaoVietBank"),
  bank("SEAB", "970440", "SeABank"),
  bank("COOPBANK", "970446", "COOPBANK"),
  bank("LPB", "970449", "LPBank"),
  bank("KLB", "970452", "KienLongBank"),
  bank("KBank", "668888", "KBank"),
  bank("MAFC", "977777", "MAFC"),
  bank("HLBVN", "970442", "HongLeong"),
  bank("KEBHANAHN", "970467", "KEBHANAHN"),
  bank("KEBHANAHCM", "970466", "KEBHanaHCM"),
  bank("CITIBANK", "533948", "Citibank"),
  bank("CBB", "970444", "CBBank"),
  bank("CIMB", "422589", "CIMB"),
  bank("DBS", "796500", "DBSBank"),
  bank("Vikki", "970406", "Vikki"),
  bank("VBSP", "999888", "VBSP"),
  bank("GPB", "970408", "GPBank"),
  bank("KBHCM", "970463", "KookminHCM"),
  bank("KBHN", "970462", "KookminHN"),
  bank("WVN", "970457", "Woori"),
  bank("VRB", "970421", "VRB"),
  bank("HSBC", "458761", "HSBC"),
  bank("IBK-HN", "970455", "IBKHN"),
  bank("IBK-HCM", "970456", "IBKHCM"),
  bank("IVB", "970434", "IndovinaBank"),
  bank("UOB", "970458", "UnitedOverseas"),
  bank("NHB HN", "801011", "Nonghyup"),
  bank("SCVN", "970410", "StandardChartered"),
  bank("PBVN", "970439", "PublicBank"),
];

export function findBankByBin(bin: string): undefined | VietQrBank {
  const normalized = bin.trim();
  if (!normalized) return undefined;
  return VIETQR_BANKS.find((b) => b.bin === normalized);
}

export function searchBanks(query: string): VietQrBank[] {
  const q = query.trim().toLowerCase();
  if (!q) return VIETQR_BANKS;

  return VIETQR_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.bin.includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.label.toLowerCase().includes(q),
  );
}
