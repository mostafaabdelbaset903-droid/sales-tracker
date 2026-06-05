{/* Bonus Rules Info */}
<div className="bg-accent/50 rounded-xl border border-border p-4">
  <div className="flex items-start gap-3">
    <Info className="w-5 h-5 text-primary mt-0.5" />
    <div className="text-sm">
      <p className="font-medium text-foreground mb-2">
        Bonus Calculation Rules
      </p>

      <ul className="space-y-1 text-muted-foreground">
        <li>
          Achievement &ge; 131%:{" "}
          <span className="text-emerald-600 font-medium">
            193.75% of bonus
          </span>
        </li>
        <li>
          Achievement &ge; 121%:{" "}
          <span className="text-emerald-600 font-medium">
            175% of bonus
          </span>
        </li>
        <li>
          Achievement &ge; 116%:{" "}
          <span className="text-emerald-600 font-medium">
            156.25% of bonus
          </span>
        </li>
        <li>
          Achievement &ge; 111%:{" "}
          <span className="text-emerald-600 font-medium">
            137.5% of bonus
          </span>
        </li>
        <li>
          Achievement &ge; 106%:{" "}
          <span className="text-emerald-600 font-medium">
            118.75% of bonus
          </span>
        </li>
        <li>
          Achievement &ge; 100%:{" "}
          <span className="text-emerald-600 font-medium">
            100% of bonus
          </span>
        </li>
        <li>
          Achievement &ge; 90%:{" "}
          <span className="text-blue-600 font-medium">
            81.25% of bonus
          </span>
        </li>
        <li>
          Achievement &ge; 80%:{" "}
          <span className="text-amber-600 font-medium">
            62.5% of bonus
          </span>
        </li>
        <li>
          Achievement &lt; 80%:{" "}
          <span className="text-red-500 font-medium">No bonus</span>
        </li>
      </ul>

      <p className="text-xs text-muted-foreground mt-3">
        This rule applies to Washing, Kitchen, and Entertainment categories.
        Air Conditioning uses its own unit-based bonus calculation.
      </p>
    </div>
  </div>
</div>
