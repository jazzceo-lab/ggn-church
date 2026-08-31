"use client";

import { SIGNUP_GROUP_OPTIONS } from "@/lib/teamRoster";
import { titleBadgeClass } from "@/lib/memberTitle";
import { avatarUrl } from "@/lib/avatar";

const UNASSIGNED = "미배정";

export default function MemberPicker({ members, selectedIds, onToggle, viewerDistrict, canSelectAllDistricts, selfId }) {
  return (
    <>
      {members.length === 0 && (
        <p className="mt-2 text-sm text-foreground/50">다른 교인이 아직 없어요.</p>
      )}
      {[...SIGNUP_GROUP_OPTIONS, UNASSIGNED].map((district) => {
        const group = members.filter((m) => (m.district ?? UNASSIGNED) === district);
        if (group.length === 0) return null;
        const toggleableGroup = group.filter((m) => m.id !== selfId);
        const allSelected = toggleableGroup.length > 0 && toggleableGroup.every((m) => selectedIds.includes(m.id));
        const canSelectAllThisDistrict = canSelectAllDistricts || district === viewerDistrict;
        return (
          <div key={district} className="mt-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-brand-dark">
              {district}
              {canSelectAllThisDistrict && toggleableGroup.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    toggleableGroup.forEach((m) => {
                      const isSelected = selectedIds.includes(m.id);
                      if (allSelected && isSelected) onToggle(m.id);
                      else if (!allSelected && !isSelected) onToggle(m.id);
                    });
                  }}
                  className="font-normal text-foreground/40 underline"
                >
                  {allSelected ? "전체 해제" : "전체 선택"}
                </button>
              )}
            </p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {group.map((m) => {
                const isSelf = m.id === selfId;
                const checked = isSelf || selectedIds.includes(m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => onToggle(m.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                        checked
                          ? "border-brand bg-brand text-white"
                          : "border-black/10 text-foreground/70 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                      } ${isSelf ? "opacity-80" : ""}`}
                    >
                      {avatarUrl(m.avatar_path) ? (
                        <img
                          src={avatarUrl(m.avatar_path)}
                          alt=""
                          className="h-4 w-4 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/10 text-[9px] dark:bg-white/10">
                          🙂
                        </span>
                      )}
                      {checked ? "✓ " : ""}
                      {m.display_name}
                      {isSelf && " (나)"}
                      {m.title && (
                        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${titleBadgeClass(m.title)}`}>
                          {m.title}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </>
  );
}
