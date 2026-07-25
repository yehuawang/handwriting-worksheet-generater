import type { WorksheetPageModel } from "../../core/worksheet";

interface WorksheetPreviewProps {
  readonly model: WorksheetPageModel;
  readonly fontSizeMm: number;
  readonly fontFamily: string;
  readonly textColor: string;
  readonly showCalibration: boolean;
  readonly zoomPercent: number;
}

const LINE_STYLES = {
  ascender: { color: "#b7c7d8", dash: undefined },
  "x-height": { color: "#a9bdd2", dash: "1.6 1.6" },
  baseline: { color: "#7892ad", dash: undefined },
  descender: { color: "#b7c7d8", dash: undefined },
} as const;

export function WorksheetPreview({
  model,
  fontSizeMm,
  fontFamily,
  textColor,
  showCalibration,
  zoomPercent,
}: WorksheetPreviewProps) {
  const { pageSize, rows, guidelineGeometry } = model;
  const contentLeft = model.contentLeftMm;
  const contentRight = contentLeft + model.contentWidthMm;

  return (
    <svg
      className="worksheet-page"
      width={pageSize.widthMm}
      height={pageSize.heightMm}
      style={{
        height: `${zoomPercent}%`,
        maxWidth: zoomPercent === 100 ? "100%" : "none",
      }}
      viewBox={`0 0 ${pageSize.widthMm} ${pageSize.heightMm}`}
      role="img"
      aria-label={`Preview of worksheet page ${model.pageNumber}`}
    >
      <defs>
        <clipPath id="worksheet-content-clip">
          <rect
            x={contentLeft}
            y={model.contentTopMm}
            width={model.contentWidthMm}
            height={model.contentHeightMm}
          />
        </clipPath>
      </defs>

      <rect
        x="0"
        y="0"
        width={pageSize.widthMm}
        height={pageSize.heightMm}
        fill="#ffffff"
      />

      <PageLabels model={model} textColor={textColor} />

      {rows.flatMap((row) =>
        guidelineGeometry.guidelines.map((guideline) => {
          const style = LINE_STYLES[guideline.kind];
          const y = row.topYmm + guideline.yMm;

          return (
            <line
              key={`${row.id}-${guideline.kind}`}
              x1={contentLeft}
              x2={contentRight}
              y1={y}
              y2={y}
              stroke={style.color}
              strokeWidth="0.25"
              strokeDasharray={style.dash}
              vectorEffect="non-scaling-stroke"
            />
          );
        }),
      )}

      <g clipPath="url(#worksheet-content-clip)">
        {rows
          .filter(({ kind, text }) => kind === "example" && text.length > 0)
          .map((row) => (
            <text
              key={`${row.id}-text`}
              x={contentLeft}
              y={row.baselineYmm}
              fill={textColor}
              fontFamily={fontFamily}
              fontSize={fontSizeMm}
              xmlSpace="preserve"
            >
              {row.text}
            </text>
          ))}
      </g>

      {showCalibration ? (
        <CalibrationMark
          pageHeightMm={pageSize.heightMm}
          startXmm={contentLeft}
        />
      ) : null}
    </svg>
  );
}

function PageLabels({
  model,
  textColor,
}: {
  readonly model: WorksheetPageModel;
  readonly textColor: string;
}) {
  const { labels, contentLeftMm, contentWidthMm } = model;
  const contentRightMm = contentLeftMm + contentWidthMm;
  const commonProps = {
    fill: textColor,
    fontFamily: 'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  return (
    <g aria-label="Page header and footer">
      {labels.headerLeft ? (
        <text
          x={contentLeftMm}
          y={labels.headerBaselineYmm}
          fontSize={labels.headerFontSizeMm}
          {...commonProps}
        >
          {labels.headerLeft}
        </text>
      ) : null}
      {labels.headerRight ? (
        <text
          x={contentRightMm}
          y={labels.headerBaselineYmm}
          fontSize={labels.headerFontSizeMm}
          textAnchor="end"
          {...commonProps}
        >
          {labels.headerRight}
        </text>
      ) : null}
      {labels.footerCenter ? (
        <text
          x={model.pageSize.widthMm / 2}
          y={labels.footerBaselineYmm}
          fontSize={labels.footerFontSizeMm}
          textAnchor="middle"
          {...commonProps}
        >
          {labels.footerCenter}
        </text>
      ) : null}
    </g>
  );
}

function CalibrationMark({
  pageHeightMm,
  startXmm,
}: {
  readonly pageHeightMm: number;
  readonly startXmm: number;
}) {
  const y = pageHeightMm - 6;
  const endX = startXmm + 50;

  return (
    <g aria-label="50 millimetre print calibration mark">
      <line
        x1={startXmm}
        x2={endX}
        y1={y}
        y2={y}
        stroke="#6b7280"
        strokeWidth="0.25"
      />
      <line
        x1={startXmm}
        x2={startXmm}
        y1={y - 1.5}
        y2={y + 1.5}
        stroke="#6b7280"
        strokeWidth="0.25"
      />
      <line
        x1={endX}
        x2={endX}
        y1={y - 1.5}
        y2={y + 1.5}
        stroke="#6b7280"
        strokeWidth="0.25"
      />
      <text
        x={startXmm + 25}
        y={y - 1.5}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="2.5"
        fill="#6b7280"
      >
        50 mm calibration
      </text>
    </g>
  );
}
