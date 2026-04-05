const ADJECTIVES = [
  "번개맞은", "졸린", "신난", "배고픈", "용감한",
  "수줍은", "활발한", "조용한", "귀여운", "멋진",
  "따뜻한", "시원한", "씩씩한", "느긋한", "재빠른",
  "호기심많은", "깜짝놀란", "두근거리는", "설레는", "당황한",
];

const ANIMALS = [
  "고양이", "강아지", "토끼", "다람쥐", "펭귄",
  "코알라", "판다", "여우", "부엉이", "돌고래",
  "햄스터", "수달", "알파카", "미어캣", "카피바라",
  "고슴도치", "치타", "레서판다", "물개", "북극곰",
];

const DEVICE_NICK_KEY = "hear-that-nickname";

export function getNickname(deviceUuid: string): string {
  if (typeof window === "undefined") return "익명";

  let nick = localStorage.getItem(DEVICE_NICK_KEY);
  if (nick) return nick;

  // uuid 기반 deterministic 선택
  const hash = deviceUuid
    .split("")
    .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const adj = ADJECTIVES[Math.abs(hash) % ADJECTIVES.length];
  const animal = ANIMALS[Math.abs(hash >> 8) % ANIMALS.length];

  nick = `${adj} ${animal}`;
  localStorage.setItem(DEVICE_NICK_KEY, nick);
  return nick;
}

export function nicknameFromUuid(uuid: string): string {
  const hash = uuid
    .split("")
    .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const adj = ADJECTIVES[Math.abs(hash) % ADJECTIVES.length];
  const animal = ANIMALS[Math.abs(hash >> 8) % ANIMALS.length];
  return `${adj} ${animal}`;
}
