"use client";

import { useLanguage } from "../../../../context/language";

type Props = {
  issueNumber: number;
  dateLabel: string;
};

export function ChallengeMasthead({ issueNumber, dateLabel }: Props) {
  const { t } = useLanguage();
  const issueText = (t.challenge.ui.issueNumber as string).replace(
    "{id}",
    String(issueNumber),
  );
  return (
    <header className="ch-mast">
      <div className="ch-mast__l">{t.challenge.ui.dailyLabel}</div>
      <div className="ch-mast__c">
        <span className="ch-mast__hline" />
        {issueText}
        <span className="ch-mast__hline" />
      </div>
      <div className="ch-mast__r">{dateLabel}</div>
    </header>
  );
}
