"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, FileText, LoaderCircle, Sparkles } from "lucide-react";
import { loginWithPasswordAction, registerWithPasswordAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_ACTION_STATE } from "@/lib/auth/types";
import { cn } from "@/lib/utils";
import { AuthButton } from "@/components/ui/AuthButton";
import { AuthCheckbox } from "@/components/ui/AuthCheckbox";
import { AuthInput } from "@/components/ui/AuthInput";
import { AuthLabel } from "@/components/ui/AuthLabel";

type AuthMode = "login" | "register";
type FocusZone = "identity" | "password" | null;
type PointerState = {
  x: number;
  y: number;
  active: boolean;
};
type LookOffset = {
  x: number;
  y: number;
};
type CharacterPose = {
  faceX: number;
  faceY: number;
  bodySkew: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function usePointerPosition() {
  const [pointer, setPointer] = useState<PointerState>({ x: 0, y: 0, active: false });

  useEffect(() => {
    let frame = 0;

    const updatePointer = (x: number, y: number, active: boolean) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setPointer({ x, y, active });
      });
    };

    const handleMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY, true);
    };

    const handleLeave = () => {
      updatePointer(window.innerWidth / 2, window.innerHeight / 2, false);
    };

    handleLeave();
    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return pointer;
}

function useBlinking() {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      blinkTimer = setTimeout(
        () => {
          setBlinking(true);
          resetTimer = setTimeout(() => {
            setBlinking(false);
            schedule();
          }, 140);
        },
        Math.round(Math.random() * 4000 + 3000),
      );
    };

    schedule();

    return () => {
      if (blinkTimer) clearTimeout(blinkTimer);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  return blinking;
}

function calculatePose(node: HTMLDivElement | null, pointer: PointerState, strength = 1): CharacterPose {
  if (!node || !pointer.active) {
    return { faceX: 0, faceY: 0, bodySkew: 0 };
  }

  const rect = node.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 3;
  const deltaX = pointer.x - centerX;
  const deltaY = pointer.y - centerY;

  return {
    faceX: clamp((deltaX / 20) * strength, -15, 15),
    faceY: clamp((deltaY / 30) * strength, -10, 10),
    bodySkew: clamp((-deltaX / 125) * strength, -6, 6),
  };
}

function useCharacterPose(ref: RefObject<HTMLDivElement | null>, pointer: PointerState, strength = 1) {
  const [pose, setPose] = useState<CharacterPose>({ faceX: 0, faceY: 0, bodySkew: 0 });

  useEffect(() => {
    setPose(calculatePose(ref.current, pointer, strength));
  }, [pointer, ref, strength]);

  return pose;
}

function poseToLookOffset(pose: CharacterPose, maxX: number, maxY: number, intensity = 1): LookOffset {
  return {
    x: clamp(pose.faceX * 0.32 * intensity, -maxX, maxX),
    y: clamp(pose.faceY * 0.38 * intensity, -maxY, maxY),
  };
}

function EyeBall({
  blinking = false,
  look,
  size = 18,
  pupilSize = 7,
  sclera = "#ffffff",
  pupil = "#2d2d2d",
}: {
  blinking?: boolean;
  look: LookOffset;
  size?: number;
  pupilSize?: number;
  sclera?: string;
  pupil?: string;
}) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full transition-[height,transform] duration-150"
      style={{
        width: `${size}px`,
        height: blinking ? "2px" : `${size}px`,
        backgroundColor: sclera,
      }}
    >
      {!blinking ? (
        <div
          className="rounded-full transition-transform duration-100 ease-out"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupil,
            transform: `translate(${look.x}px, ${look.y}px)`,
          }}
        />
      ) : null}
    </div>
  );
}

function Pupil({
  look,
  size = 12,
  color = "#2d2d2d",
}: {
  look: LookOffset;
  size?: number;
  color?: string;
}) {
  return (
    <div
      className="rounded-full transition-transform duration-100 ease-out"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        transform: `translate(${look.x}px, ${look.y}px)`,
      }}
    />
  );
}

function SubmitButton({
  disabled = false,
  idleLabel,
  pendingLabel,
}: {
  disabled?: boolean;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <AuthButton
      aria-disabled={isDisabled}
      className="h-12 w-full justify-center rounded-[20px]"
      disabled={isDisabled}
      size="lg"
      type="submit"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
      {pending ? pendingLabel : idleLabel}
    </AuthButton>
  );
}

function FieldMessage({ children, tone = "error" }: { children?: string; tone?: "error" | "info" }) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn(
        "text-sm leading-5",
        tone === "error" ? "text-[oklch(0.56_0.18_24)]" : "text-[#165dff]",
      )}
      style={{ textWrap: "pretty" }}
    >
      {children}
    </p>
  );
}

function CharacterStage({
  activeMode,
  focusZone,
  passwordValue,
  showPassword,
}: {
  activeMode: AuthMode;
  focusZone: FocusZone;
  passwordValue: string;
  showPassword: boolean;
}) {
  const pointer = usePointerPosition();
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);
  const purpleBlinking = useBlinking();
  const blackBlinking = useBlinking();
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const isLookingAtEachOther = focusZone === "identity";

  useEffect(() => {
    if (!(showPassword && passwordValue.length > 0)) {
      return;
    }

    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const schedulePeek = () => {
      revealTimer = setTimeout(
        () => {
          setIsPurplePeeking(true);
          hideTimer = setTimeout(() => {
            setIsPurplePeeking(false);
            schedulePeek();
          }, 700);
        },
        Math.round(Math.random() * 2600 + 1800),
      );
    };

    schedulePeek();

    return () => {
      if (revealTimer) clearTimeout(revealTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [passwordValue.length, showPassword]);

  const purplePose = useCharacterPose(purpleRef, pointer, 1.1);
  const blackPose = useCharacterPose(blackRef, pointer, 0.95);
  const yellowPose = useCharacterPose(yellowRef, pointer, 0.9);
  const orangePose = useCharacterPose(orangeRef, pointer, 0.8);
  const passwordReveal = showPassword && passwordValue.length > 0;
  const purplePeeking = passwordReveal && isPurplePeeking;

  const purpleLook = passwordReveal
    ? { x: purplePeeking ? 4 : -4, y: purplePeeking ? 5 : -4 }
    : isLookingAtEachOther
      ? { x: 3, y: 3 }
      : poseToLookOffset(purplePose, 5, 5, 1.1);

  const blackLook = passwordReveal
    ? { x: -4, y: -4 }
    : isLookingAtEachOther
      ? { x: 0, y: -4 }
      : poseToLookOffset(blackPose, 4, 4, 0.95);

  const orangeLook = passwordReveal ? { x: -5, y: -4 } : poseToLookOffset(orangePose, 5, 5, 0.9);
  const yellowLook = passwordReveal ? { x: -5, y: -4 } : poseToLookOffset(yellowPose, 5, 5, 0.95);

  return (
    <section className="relative flex min-h-[22rem] flex-col overflow-hidden rounded-[26px] border border-[#d9e4f2]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(241,246,255,0.92))] p-4 shadow-[0_18px_36px_rgba(15,35,95,0.08)] sm:rounded-[30px] sm:p-5 lg:p-6 xl:min-h-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,93,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(64,128,255,0.1),transparent_28%)]" />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#d9e4f2] bg-white/84 px-3 py-2 shadow-[0_10px_22px_rgba(15,35,95,0.05)] sm:px-4">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4080ff,#165dff)] text-white shadow-[0_10px_24px_rgba(22,93,255,0.22)] sm:size-10">
              <FileText className="size-4.5 sm:size-5" />
            </span>
            <div className="leading-none">
              <p className="text-[0.92rem] font-semibold text-[#1d2129] sm:text-[0.95rem]">Resume Studio</p>
              <p className="mt-1 text-[0.72rem] uppercase tracking-[0.16em] text-[#86909c] sm:text-[0.76rem]">
                工作台访问
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-[#d9e4f2] bg-white/74 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4e5969] md:inline-flex">
            <Sparkles className="size-3.5 text-[#165dff]" />
            {activeMode === "login" ? "登录" : "创建账号"}
          </div>
        </div>

        <div className="mt-4 max-w-[32rem] sm:mt-5 lg:max-w-[38rem] 2xl:max-w-[42rem]">
          <h1
            className="text-[clamp(1.8rem,5vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.06em] text-[#1d2129]"
            style={{ textWrap: "balance" }}
          >
            进入简历工作台
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-2.5">
            <span className="rounded-full border border-[#d9e4f2] bg-white/76 px-3 py-1.5 text-sm font-medium text-[#4e5969]">
              模板
            </span>
            <span className="rounded-full border border-[#d9e4f2] bg-white/76 px-3 py-1.5 text-sm font-medium text-[#4e5969]">
              编辑
            </span>
            <span className="rounded-full border border-[#d9e4f2] bg-white/76 px-3 py-1.5 text-sm font-medium text-[#4e5969]">
              预览
            </span>
          </div>
        </div>

        <div
          className="relative mt-4 flex min-h-[190px] flex-1 items-end justify-center overflow-hidden rounded-[24px] border border-[#d9e4f2]/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(233,241,255,0.94))] px-3 pb-3 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:mt-5 sm:min-h-[240px] sm:px-6 sm:pb-4 sm:pt-8 lg:mt-8 lg:min-h-[500px] lg:px-8 lg:pt-10 xl:min-h-[560px] 2xl:min-h-[620px]"
          data-testid="auth-character-stage"
        >
          <div className="absolute left-[-52px] top-[-52px] h-48 w-48 rounded-full bg-[#165dff]/12 blur-3xl" />
          <div className="absolute bottom-[-70px] right-[-40px] h-60 w-60 rounded-full bg-[#4080ff]/12 blur-3xl" />
          <div className="absolute inset-x-4 bottom-4 h-[88px] rounded-[28px] bg-[linear-gradient(180deg,rgba(214,227,249,0),rgba(201,219,247,0.66))]" />

          <div className="relative h-[180px] w-[210px] sm:h-[250px] sm:w-[300px] md:h-[320px] md:w-[380px] lg:h-[420px] lg:w-[520px] xl:h-[470px] xl:w-[620px] 2xl:h-[540px] 2xl:w-[720px]">
            <div
              ref={purpleRef}
              className="absolute bottom-0 left-[12%] transition-transform duration-700 ease-out"
              data-testid="auth-character-purple"
              style={{
                width: "32%",
                height: passwordReveal ? "90%" : focusZone ? "94%" : "86%",
                backgroundColor: "#5b6cff",
                borderRadius: "18px 18px 0 0",
                zIndex: 1,
                transform: passwordReveal
                  ? "skewX(0deg)"
                  : focusZone === "password"
                    ? `skewX(${purplePose.bodySkew - 11}deg) translateX(34px)`
                    : `skewX(${purplePose.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-700 ease-out"
                style={{
                  left: passwordReveal ? "18px" : isLookingAtEachOther ? "48px" : `${38 + purplePose.faceX}px`,
                  top: passwordReveal ? "32px" : isLookingAtEachOther ? "58px" : `${34 + purplePose.faceY}px`,
                }}
              >
                <EyeBall blinking={purpleBlinking} look={purpleLook} />
                <EyeBall blinking={purpleBlinking} look={purpleLook} />
              </div>
            </div>

            <div
              ref={blackRef}
              className="absolute bottom-0 left-[44%] transition-transform duration-700 ease-out"
              data-testid="auth-character-black"
              style={{
                width: "21%",
                height: "66%",
                backgroundColor: "#1d2129",
                borderRadius: "14px 14px 0 0",
                zIndex: 2,
                transform: passwordReveal
                  ? "skewX(0deg)"
                  : isLookingAtEachOther
                    ? `skewX(${blackPose.bodySkew * 1.4 + 9}deg) translateX(18px)`
                    : `skewX(${focusZone === "password" ? blackPose.bodySkew * 1.4 : blackPose.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-5 transition-all duration-700 ease-out"
                style={{
                  left: passwordReveal ? "10px" : isLookingAtEachOther ? "26px" : `${22 + blackPose.faceX}px`,
                  top: passwordReveal ? "22px" : isLookingAtEachOther ? "10px" : `${26 + blackPose.faceY}px`,
                }}
              >
                <EyeBall blinking={blackBlinking} look={blackLook} size={16} pupilSize={6} />
                <EyeBall blinking={blackBlinking} look={blackLook} size={16} pupilSize={6} />
              </div>
            </div>

            <div
              ref={orangeRef}
              className="absolute bottom-0 left-0 transition-transform duration-700 ease-out"
              data-testid="auth-character-orange"
              style={{
                width: "43%",
                height: "44%",
                backgroundColor: "#ff9b6b",
                borderRadius: "200px 200px 0 0",
                zIndex: 3,
                transform: passwordReveal ? "skewX(0deg)" : `skewX(${orangePose.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: passwordReveal ? "46px" : `${76 + orangePose.faceX}px`,
                  top: passwordReveal ? "68px" : `${78 + orangePose.faceY}px`,
                }}
              >
                <Pupil look={orangeLook} />
                <Pupil look={orangeLook} />
              </div>
            </div>

            <div
              ref={yellowRef}
              className="absolute bottom-0 left-[58%] transition-transform duration-700 ease-out"
              data-testid="auth-character-yellow"
              style={{
                width: "25%",
                height: "48%",
                backgroundColor: "#e8d754",
                borderRadius: "200px 200px 0 0",
                zIndex: 4,
                transform: passwordReveal ? "skewX(0deg)" : `skewX(${yellowPose.bodySkew}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-5 transition-all duration-200 ease-out"
                style={{
                  left: passwordReveal ? "18px" : `${44 + yellowPose.faceX}px`,
                  top: passwordReveal ? "26px" : `${32 + yellowPose.faceY}px`,
                }}
              >
                <Pupil look={yellowLook} />
                <Pupil look={yellowLook} />
              </div>
              <div
                className="absolute h-[4px] w-16 rounded-full bg-[#2d2d2d] transition-all duration-200 ease-out"
                style={{
                  left: passwordReveal ? "12px" : `${34 + yellowPose.faceX}px`,
                  top: passwordReveal ? "78px" : `${80 + yellowPose.faceY}px`,
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export function AnimatedCharactersLoginPage({
  hasLegacyResumes,
  hasUsers,
  nextPath,
}: {
  hasLegacyResumes: boolean;
  hasUsers: boolean;
  nextPath: string;
}) {
  const [activeMode, setActiveMode] = useState<AuthMode>(hasUsers ? "login" : "register");
  const [focusedZone, setFocusedZone] = useState<FocusZone>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginState, loginAction] = useActionState(loginWithPasswordAction, INITIAL_AUTH_ACTION_STATE);
  const [registerState, registerAction] = useActionState(registerWithPasswordAction, INITIAL_AUTH_ACTION_STATE);
  const [loginPassword, setLoginPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const state = activeMode === "login" ? loginState : registerState;
  const loginUnavailable = !hasUsers;
  const activePasswordValue = activeMode === "login" ? loginPassword : registerPassword;
  const handleModeChange = (mode: AuthMode) => {
    setActiveMode(mode);
    setFocusedZone(null);
    setShowPassword(false);
  };
  const subtitle = useMemo(() => {
    if (activeMode === "login") {
      if (loginUnavailable) {
        return "创建首个账号";
      }

      return nextPath !== "/" ? "继续当前操作" : "进入工作台";
    }

    return hasUsers ? "创建新账号" : "创建首个账号";
  }, [activeMode, hasUsers, loginUnavailable, nextPath]);
  const infoMessage = useMemo(() => {
    if (activeMode === "login" && loginUnavailable) {
      return "当前暂无可登录账号，请先注册。";
    }

    if (hasLegacyResumes && !hasUsers && activeMode === "register") {
      return "首个账号将自动接管当前本地草稿。";
    }

    return undefined;
  }, [activeMode, hasLegacyResumes, hasUsers, loginUnavailable]);
  const nameId = useId();
  const loginEmailId = useId();
  const loginPasswordId = useId();
  const registerEmailId = useId();
  const registerPasswordId = useId();
  const confirmPasswordId = useId();
  const rememberId = useId();
  const loginPanelId = useId();
  const registerPanelId = useId();

  return (
    <main
      className="fixed inset-0 z-20 overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(22,93,255,0.12),transparent_28%),linear-gradient(180deg,#f5f7fa_0%,#f7f8fa_100%)] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 xl:px-8 xl:py-8"
      data-auth-login="true"
    >
      <div className="mx-auto grid min-h-full w-full max-w-[1880px] grid-rows-[minmax(0,0.88fr)_minmax(0,1fr)] gap-3 rounded-[28px] border border-white/80 bg-white/66 p-3 shadow-[0_24px_72px_rgba(15,35,95,0.08)] backdrop-blur sm:grid-rows-[minmax(0,0.96fr)_minmax(0,1fr)] sm:gap-4 sm:rounded-[32px] sm:p-4 md:p-5 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)] lg:grid-rows-1 lg:gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(24rem,0.78fr)] 2xl:grid-cols-[minmax(0,1.38fr)_minmax(26rem,0.72fr)]">
        <CharacterStage
          activeMode={activeMode}
          focusZone={focusedZone}
          passwordValue={activePasswordValue}
          showPassword={showPassword}
        />

        <section className="flex min-h-0 rounded-[26px] border border-[#d9e4f2]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,250,255,0.96))] p-4 shadow-[0_18px_36px_rgba(15,35,95,0.06)] sm:rounded-[30px] sm:p-5 lg:p-6">
          <div className="m-auto w-full max-w-[26rem] min-h-0 xl:max-w-[28rem]">
            <div className="max-h-full overflow-hidden rounded-[22px] border border-[#d9e4f2] bg-white/84 p-4 shadow-[0_12px_28px_rgba(15,35,95,0.05)] sm:rounded-[24px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-[#86909c]">{subtitle}</p>
                  <h2 className="mt-2 text-[1.9rem] font-semibold tracking-[-0.05em] text-[#1d2129]">
                    {activeMode === "login" ? "登录" : hasUsers ? "注册" : "创建账号"}
                  </h2>
                </div>
                <span className="inline-flex size-11 items-center justify-center rounded-[18px] border border-[#d9e4f2] bg-[#edf4ff] text-[#165dff]">
                  <Sparkles className="size-5" />
                </span>
              </div>

              <div
                aria-label="账号模式切换"
                className="mt-4 grid grid-cols-2 gap-2 rounded-[20px] border border-[#d9e4f2] bg-[#f7f8fa] p-1 sm:mt-5 sm:rounded-[22px]"
                role="tablist"
              >
                <button
                  aria-controls={loginPanelId}
                  aria-selected={activeMode === "login"}
                  className={cn(
                    "rounded-[18px] px-4 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#165dff]/20 focus-visible:ring-offset-2 active:translate-y-px",
                    activeMode === "login"
                      ? "bg-white text-[#165dff] shadow-[0_8px_18px_rgba(15,35,95,0.08)]"
                      : "text-[#4e5969] hover:bg-white/70 hover:text-[#1d2129]",
                  )}
                  onClick={() => handleModeChange("login")}
                  role="tab"
                  type="button"
                >
                  登录
                </button>
                <button
                  aria-controls={registerPanelId}
                  aria-selected={activeMode === "register"}
                  className={cn(
                    "rounded-[18px] px-4 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#165dff]/20 focus-visible:ring-offset-2 active:translate-y-px",
                    activeMode === "register"
                      ? "bg-white text-[#165dff] shadow-[0_8px_18px_rgba(15,35,95,0.08)]"
                      : "text-[#4e5969] hover:bg-white/70 hover:text-[#1d2129]",
                  )}
                  onClick={() => handleModeChange("register")}
                  role="tab"
                  type="button"
                >
                  注册
                </button>
              </div>

              <div className="mt-3 space-y-2 sm:mt-4">
                <FieldMessage tone="info">{infoMessage}</FieldMessage>
                <FieldMessage>{state.message}</FieldMessage>
              </div>

              {activeMode === "login" ? (
                <form action={loginAction} className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-4" id={loginPanelId}>
                  <input name="next" type="hidden" value={nextPath} />
                  <input name="remember" type="hidden" value={remember ? "true" : "false"} />

                  <div className="space-y-2">
                    <AuthLabel htmlFor={loginEmailId}>邮箱</AuthLabel>
                    <AuthInput
                      autoComplete="email"
                      id={loginEmailId}
                      name="email"
                      onBlur={() => setFocusedZone(null)}
                      onFocus={() => setFocusedZone("identity")}
                      placeholder="you@example.com"
                      type="email"
                    />
                    <FieldMessage>{loginState.fields?.email}</FieldMessage>
                  </div>

                  <div className="space-y-2">
                    <AuthLabel htmlFor={loginPasswordId}>密码</AuthLabel>
                    <div className="relative">
                      <AuthInput
                        autoComplete="current-password"
                        className="pr-14"
                        id={loginPasswordId}
                        name="password"
                        onBlur={() => setFocusedZone(null)}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        onFocus={() => setFocusedZone("password")}
                        placeholder="输入密码"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                      />
                      <button
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                        className="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-[#86909c] transition-[background-color,color,transform,box-shadow] duration-200 hover:bg-[#edf4ff] hover:text-[#165dff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#165dff]/20 focus-visible:ring-offset-2 active:scale-[0.96]"
                        onClick={() => setShowPassword((value) => !value)}
                        type="button"
                      >
                        {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                      </button>
                    </div>
                    <FieldMessage>{loginState.fields?.password}</FieldMessage>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#d9e4f2] bg-[#f7f8fa] px-4 py-3 sm:rounded-[20px]">
                    <div className="flex items-center gap-3">
                      <AuthCheckbox
                        checked={remember}
                        id={rememberId}
                        onCheckedChange={(checked) => setRemember(checked === true)}
                      />
                      <AuthLabel className="cursor-pointer text-sm font-medium text-[#4e5969]" htmlFor={rememberId}>
                        保持登录
                      </AuthLabel>
                    </div>
                    <span className="text-xs font-medium text-[#86909c]">30 天</span>
                  </div>

                  <SubmitButton
                    disabled={loginUnavailable}
                    idleLabel={loginUnavailable ? "先注册账号" : "进入工作台"}
                    pendingLabel="登录中..."
                  />
                </form>
              ) : (
                <form action={registerAction} className="mt-4 space-y-3.5 sm:mt-5 sm:space-y-4" id={registerPanelId}>
                  <input name="next" type="hidden" value={nextPath} />

                  <div className="space-y-2">
                    <AuthLabel htmlFor={nameId}>姓名</AuthLabel>
                    <AuthInput
                      autoComplete="name"
                      id={nameId}
                      name="name"
                      onBlur={() => setFocusedZone(null)}
                      onFocus={() => setFocusedZone("identity")}
                      placeholder="请输入姓名"
                      type="text"
                    />
                    <FieldMessage>{registerState.fields?.name}</FieldMessage>
                  </div>

                  <div className="space-y-2">
                    <AuthLabel htmlFor={registerEmailId}>邮箱</AuthLabel>
                    <AuthInput
                      autoComplete="email"
                      id={registerEmailId}
                      name="email"
                      onBlur={() => setFocusedZone(null)}
                      onFocus={() => setFocusedZone("identity")}
                      placeholder="you@example.com"
                      type="email"
                    />
                    <FieldMessage>{registerState.fields?.email}</FieldMessage>
                  </div>

                  <div className="space-y-2">
                    <AuthLabel htmlFor={registerPasswordId}>密码</AuthLabel>
                    <div className="relative">
                      <AuthInput
                        autoComplete="new-password"
                        className="pr-14"
                        id={registerPasswordId}
                        name="password"
                        onBlur={() => setFocusedZone(null)}
                        onChange={(event) => setRegisterPassword(event.target.value)}
                        onFocus={() => setFocusedZone("password")}
                        placeholder="至少 8 位"
                        type={showPassword ? "text" : "password"}
                        value={registerPassword}
                      />
                      <button
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                        className="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-[#86909c] transition-[background-color,color,transform,box-shadow] duration-200 hover:bg-[#edf4ff] hover:text-[#165dff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#165dff]/20 focus-visible:ring-offset-2 active:scale-[0.96]"
                        onClick={() => setShowPassword((value) => !value)}
                        type="button"
                      >
                        {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                      </button>
                    </div>
                    <FieldMessage>{registerState.fields?.password}</FieldMessage>
                  </div>

                  <div className="space-y-2">
                    <AuthLabel htmlFor={confirmPasswordId}>确认密码</AuthLabel>
                    <AuthInput
                      autoComplete="new-password"
                      id={confirmPasswordId}
                      name="confirmPassword"
                      onBlur={() => setFocusedZone(null)}
                      onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                      onFocus={() => setFocusedZone("password")}
                      placeholder="再次输入密码"
                      type={showPassword ? "text" : "password"}
                      value={registerConfirmPassword}
                    />
                    <FieldMessage>{registerState.fields?.confirmPassword}</FieldMessage>
                  </div>

                  <SubmitButton idleLabel={hasUsers ? "创建账号" : "开始使用"} pendingLabel="创建中..." />
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
