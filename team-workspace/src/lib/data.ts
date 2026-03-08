import { WBSItem } from "./types";

export const TEAM = ["Stan", "Jay", "Mia"];

export const CATEGORIES = [
    "비즈니스 개요",
    "플레이어 역할",
    "수익 및 비용 구조",
    "앱 기능 및 구조",
    "디자인 및 브랜딩",
];

export const INITIAL_WBS: WBSItem[] = [
    { id: 1, cat: "비즈니스 개요", item: "플랫폼 개념", summary: "인디 공연 매칭 플랫폼의 핵심 개념 정의", status: "confirmed", assignee: "Stan", due: "2026-03-15", history: [] },
    { id: 2, cat: "비즈니스 개요", item: "플랫폼 이름", summary: "서비스 브랜드명 확정", status: "confirmed", assignee: "Jay", due: "2026-03-12", history: [] },
    { id: 3, cat: "비즈니스 개요", item: "BM특허 출원 여부", summary: "비즈니스 모델 특허 출원 필요성 검토", status: "discussion", assignee: "", due: "2026-03-20", history: [] },
    { id: 4, cat: "플레이어 역할", item: "공연장 심사 기준", summary: "파트너 공연장 등록 시 심사 기준 정의", status: "unconfirmed", assignee: "Mia", due: "2026-03-18", history: [] },
    { id: 5, cat: "플레이어 역할", item: "아티스트 출연료 산정", summary: "아티스트 출연료 산정 방식 및 기준", status: "unconfirmed", assignee: "", due: "2026-03-25", history: [] },
    { id: 6, cat: "수익 및 비용 구조", item: "팬 보증금 금액", summary: "공연 참여 보증금 금액 확정", status: "confirmed", assignee: "Stan", due: "2026-03-10", history: [] },
    { id: 7, cat: "수익 및 비용 구조", item: "플랫폼 수수료 비율", summary: "거래 수수료 비율 결정", status: "unconfirmed", assignee: "Jay", due: "2026-03-22", history: [] },
    { id: 8, cat: "수익 및 비용 구조", item: "큐레이터 인센티브 요율", summary: "큐레이터 보상 체계 설계", status: "unconfirmed", assignee: "", due: "2026-03-28", history: [] },
    { id: 9, cat: "수익 및 비용 구조", item: "티켓 가격 (공연 확정 후)", summary: "확정 공연 티켓 가격 정책", status: "discussion", assignee: "Mia", due: "2026-03-14", history: [] },
    { id: 10, cat: "앱 기능 및 구조", item: "원앱 구조", summary: "단일 앱 내 멀티 역할 구조 설계", status: "confirmed", assignee: "Jay", due: "2026-03-11", history: [] },
    { id: 11, cat: "앱 기능 및 구조", item: "큐레이터 없는 아티스트 발굴", summary: "AI 기반 아티스트 자동 발굴 기능", status: "unconfirmed", assignee: "", due: "2026-03-30", history: [] },
    { id: 12, cat: "앱 기능 및 구조", item: "결제 직전 신뢰 장치", summary: "결제 단계 신뢰성 확보 장치 설계", status: "unconfirmed", assignee: "Stan", due: "2026-03-16", history: [] },
    { id: 13, cat: "디자인 및 브랜딩", item: "주요 컬러 시스템", summary: "브랜드 컬러 팔레트 및 디자인 시스템", status: "confirmed", assignee: "Mia", due: "2026-03-09", history: [] },
    { id: 14, cat: "디자인 및 브랜딩", item: "온보딩 이후 UI 세부", summary: "온보딩 이후 메인 UI 상세 디자인", status: "unconfirmed", assignee: "", due: "2026-03-26", history: [] },
];
