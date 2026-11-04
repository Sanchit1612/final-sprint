type StudyPath = {
  steps: string[];
  challenge: string;
  walkthrough: string;
  choices: readonly [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
};

export const studyPaths: Record<string, StudyPath> = {
  dbms: {
    choices: ["Read stock and write later in separate requests", "Atomically decrement positive stock in the order transaction", "Keep a stock count in each browser", "Retry every order insert until it works"],
    correct: 1,
    steps: ["Keys and constraints", "Normalisation and indexes", "Transactions and isolation"],
    challenge: "Two buyers try to buy the last unit at the same time. How can the database prevent overselling?",
    walkthrough: "Use one transaction and an atomic UPDATE that decrements stock only when stock > 0. If no row is updated, report sold out. Create the order in the same transaction so a failed insert also rolls back the decrement.",
  },
  os: {
    choices: ["Acquire Y first only in thread B", "Add a third lock around logging", "Require both threads to acquire X before Y", "Increase the scheduling time slice"],
    correct: 2,
    steps: ["Processes and scheduling", "Virtual memory", "Threads, locks and deadlocks"],
    challenge: "Thread A holds lock X and waits for Y. Thread B holds Y and waits for X. How can you prevent this?",
    walkthrough: "Require every thread to acquire X before Y. A consistent global acquisition order breaks circular wait. Check every path that acquires either lock, including error handling.",
  },
  cn: {
    choices: ["The first request may have committed before its response was lost", "TCP always duplicates successful requests", "POST requests can only be handled once", "DNS caches payment outcomes"],
    correct: 0,
    steps: ["DNS and addressing", "TCP and transport", "HTTP, caching and TLS"],
    challenge: "A browser retries a request after the connection drops. Why might retrying a payment POST create a duplicate?",
    walkthrough: "The server may have committed the payment before the response was lost. Give the operation a stable idempotency key and have the server associate it with the original request and result.",
  },
  oop: {
    choices: ["Add another branch to checkout", "Make every customer inherit checkout", "Move the branches into a global variable", "Inject a discount policy behind an interface"],
    correct: 3,
    steps: ["Objects and invariants", "Interfaces and composition", "Substitution and design patterns"],
    challenge: "A checkout class handles discounts for five customer types. How can you add a sixth without changing checkout?",
    walkthrough: "Pass a discount policy through a small interface. Keep checkout responsible for the purchase and each policy responsible for its own pricing rule. Test the policy and checkout independently.",
  },
  sql: {
    choices: ["INNER JOIN and COUNT(*)", "LEFT JOIN and COUNT(orders.id)", "LEFT JOIN and COUNT(*)", "GROUP BY order ID without a join"],
    correct: 1,
    steps: ["Filtering and joins", "Aggregation and NULLs", "Window functions"],
    challenge: "List every customer and their order count, including customers with no orders.",
    walkthrough: "LEFT JOIN customers to orders and group by customer ID. Count orders.id, which is NULL on the unmatched row. COUNT(*) would incorrectly count that row as one order.",
  },
  aptitude: {
    choices: ["45 km/h", "50 km/h", "40 km/h", "30 km/h"],
    correct: 2,
    steps: ["Percentages and ratios", "Rates and averages", "Probability and counting"],
    challenge: "A train goes 60 km at 30 km/h and returns at 60 km/h. Find its average speed.",
    walkthrough: "The first leg takes two hours and the return takes one. Divide 120 km by three hours to get 40 km/h. An arithmetic mean of the speeds assumes equal time at each speed.",
  },
  behavioural: {
    choices: ["Explain your actions, the trade-off, and the real outcome", "Describe only the final decision", "List everything the team did without describing your contribution", "Skip the disagreement and describe the project"],
    correct: 0,
    steps: ["Build a story bank", "Practise conflict and ownership", "Answer follow-up questions"],
    challenge: "An interviewer asks about a disagreement with a teammate. Which approach makes the strongest 90-second answer?",
    walkthrough: "Give the goal and disagreement in one sentence each. Explain how you compared options and what you personally did. End with the actual outcome and what you learned. Rehearse a follow-up about the trade-off you made.",
  },
  interview: {
    choices: ["Immediately rewrite the database layer", "Increase timeout limits and close the investigation", "Look only at average CPU usage", "Scope the regression, compare metrics, and trace a slow request"],
    correct: 3,
    steps: ["Explain CS fundamentals aloud", "Work through failure scenarios", "Run a timed mock and debrief"],
    challenge: "A previously fast API becomes slow after a release. Walk through how you would investigate.",
    walkthrough: "Find which endpoints and time windows changed. Compare latency percentiles and error rates, then trace a slow request to locate the bottleneck. Check recent changes and mitigate before testing a targeted fix.",
  },
  development: {
    choices: ["Store every account’s applications in a shared public list", "Build the form, add private persistence, then test failures and isolation", "Start by making the status labels animated", "Build only the happy path before publishing"],
    correct: 1,
    steps: ["Build an accessible interface", "Connect and handle API failures", "Persist data and enforce ownership", "Test and deploy a preview"],
    challenge: "You need to build a placement tracker with private applications and editable statuses. Which sequence covers the core requirements?",
    walkthrough: "Start with a labelled form and list. Add validation, authenticated persistence and loading, empty and error states. Test that two users cannot read each other's entries, then deploy a preview and repeat those checks there.",
  },
};

type Reading = { label: string; href: string; task?: string };

export const topicReading: Record<string, readonly Reading[]> = {
  dbms: [
    { label: "GeeksforGeeks · Relational keys", href: "https://www.geeksforgeeks.org/dbms/types-of-keys-in-relational-model-candidate-super-primary-alternate-and-foreign/" },
    { label: "GeeksforGeeks · Normal forms", href: "https://www.geeksforgeeks.org/dbms/normal-forms-in-dbms/" },
    { label: "GeeksforGeeks · SQL transactions", href: "https://www.geeksforgeeks.org/sql/sql-transactions/" },
  ],
  os: [
    { label: "GeeksforGeeks · CPU scheduling", href: "https://www.geeksforgeeks.org/operating-systems/cpu-scheduling-in-operating-systems/" },
    { label: "GeeksforGeeks · Memory management", href: "https://www.geeksforgeeks.org/operating-systems/memory-management-in-operating-system/" },
    { label: "GeeksforGeeks · Deadlock prevention", href: "https://www.geeksforgeeks.org/operating-systems/deadlock-prevention/" },
  ],
  cn: [
    { label: "GeeksforGeeks · DNS", href: "https://www.geeksforgeeks.org/computer-networks/domain-name-system-dns-in-application-layer/" },
    { label: "GeeksforGeeks · TCP", href: "https://www.geeksforgeeks.org/computer-networks/what-is-transmission-control-protocol-tcp/" },
    { label: "MDN · HTTP overview", href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview" },
  ],
  oop: [
    { label: "GeeksforGeeks · Classes and objects", href: "https://www.geeksforgeeks.org/cpp/c-classes-and-objects/" },
    { label: "GeeksforGeeks · Abstraction", href: "https://www.geeksforgeeks.org/cpp/abstraction-in-cpp/" },
    { label: "GeeksforGeeks · Polymorphism", href: "https://www.geeksforgeeks.org/cpp/cpp-polymorphism/" },
  ],
  sql: [
    { label: "GeeksforGeeks · SQL joins", href: "https://www.geeksforgeeks.org/sql/sql-join-set-1-inner-left-right-and-full-joins/" },
    { label: "PostgreSQL · SQL tutorial", href: "https://www.postgresql.org/docs/current/tutorial.html" },
    { label: "PostgreSQL · Window functions", href: "https://www.postgresql.org/docs/current/tutorial-window.html" },
  ],
  development: [
    { label: "MDN · Web forms", href: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms", task: "Build the application form and status list. Submit it using only the keyboard and check that each field has a visible label." },
    { label: "MDN · Using Fetch", href: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", task: "Load and update applications through an API. Show loading, empty and error states, and let users retry failed requests." },
    { label: "PostgreSQL · SQL tutorial", href: "https://www.postgresql.org/docs/current/tutorial.html", task: "Persist applications with an owner, status and timestamps. Validate writes and confirm that a second account cannot read or edit the first account’s records." },
    { label: "MDN · Testing", href: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Testing", task: "Deploy a preview, then repeat sign-in, status updates, validation and keyboard checks on a narrow viewport." },
  ],
};
