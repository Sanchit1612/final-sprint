"""Reproducible metadata-only datasets. No network, database writes or invented URLs."""
import json,re,collections
from pathlib import Path
source=Path('content/sources/neetcode/problems.json'); data=json.loads(source.read_text())
commit='8fed5f7daa6a517e375a0562d876e4a72dfdafb8'
live=json.loads(Path('verification/dsa-link-checks.json').read_text()) if Path('verification/dsa-link-checks.json').exists() else {}
source_url=f'https://github.com/neetcode-gh/leetcode/blob/{commit}/.problemSiteData.json'
# Explicit additions chosen to fill prerequisites and patterns not explicit in NC150.
extras={
77:('Backtracking','Build fixed-size combinations while pruning branches with insufficient remaining values.'),120:('1-D Dynamic Programming','Compress minimum path costs row by row through a triangle.'),
724:('Prefix Sum','Balance left and right accumulated sums.'),303:('Prefix Sum','Precompute prefix sums for static range queries.'),560:('Prefix Sum','Count target-sum subarrays using prefix-sum frequencies.'),523:('Prefix Sum','Use repeated prefix remainders to detect divisible subarrays.'),304:('Prefix Sum','Extend prefix sums to rectangular matrix queries.'),
912:('Sorting','Compare divide-and-conquer sorting with quadratic approaches.'),75:('Sorting','Partition three values with in-place boundaries.'),148:('Sorting','Apply merge sort to linked nodes.'),
392:('Two Pointers','Advance a subsequence pointer while scanning another string.'),14:('Arrays & Hashing','Compare shared prefixes across strings.'),118:('1-D Dynamic Programming','Build each Pascal row from the previous row.'),705:('Arrays & Hashing','Design set membership operations and collision handling.'),706:('Arrays & Hashing','Design key-value lookup with collision handling.'),169:('Arrays & Hashing','Reason about majority counts and cancellation.'),205:('Arrays & Hashing','Maintain a consistent one-to-one character mapping.'),
344:('Two Pointers','Swap symmetric characters in place.'),88:('Two Pointers','Merge sorted arrays from their right boundaries.'),283:('Two Pointers','Compact nonzero values while preserving order.'),26:('Two Pointers','Compact a sorted array using a write pointer.'),680:('Two Pointers','Test palindrome boundaries with one allowed deletion.'),
904:('Sliding Window','Maintain a window containing at most two distinct values.'),209:('Sliding Window','Shrink a positive-sum window to minimize its length.'),438:('Sliding Window','Track character frequencies in a fixed-size window.'),
496:('Monotonic Stack','Resolve next-greater queries using a decreasing stack.'),901:('Monotonic Stack','Aggregate spans while removing dominated stock prices.'),735:('Stack','Simulate collisions between opposing moving objects.'),394:('Stack','Track nested repetition counts and partial strings.'),402:('Monotonic Stack','Remove digits greedily while maintaining increasing order.'),
35:('Binary Search','Locate the lower-bound insertion position.'),34:('Binary Search','Find both boundaries of equal values.'),162:('Binary Search','Use neighboring slopes to locate a peak.'),1011:('Binary Search','Search capacity using a monotonic shipping feasibility test.'),
876:('Linked List','Use fast and slow pointers to locate the middle.'),160:('Linked List','Align path lengths to detect a shared node.'),234:('Linked List','Compare both halves while managing pointer reversal.'),92:('Linked List','Reverse only the requested linked-list segment.'),
94:('Trees','Traverse nodes in inorder using recursion or an explicit stack.'),112:('Trees','Carry a remaining target along root-to-leaf paths.'),101:('Trees','Compare mirrored subtree pairs.'),450:('Trees','Preserve BST ordering when removing a node.'),
721:('Union Find','Merge account identities through shared email components.'),785:('Graphs','Color connected components and detect same-color conflicts.'),934:('Graphs','Combine flood fill with multi-source shortest-path expansion.'),
63:('2-D Dynamic Programming','Count grid paths while respecting blocked cells.'),64:('2-D Dynamic Programming','Accumulate minimum-cost paths through a grid.'),221:('2-D Dynamic Programming','Extend square sizes from neighboring subproblems.'),516:('2-D Dynamic Programming','Compare interval boundaries for palindromic subsequences.'),1288:('Intervals','Sort interval boundaries and identify containment.')}
assert len(extras)==50
patterns={
'Arrays & Hashing':'Use indexed lookup, counting and membership to avoid repeated scans.',
'Two Pointers':'Maintain coordinated positions and reason about which boundary can safely move.',
'Sliding Window':'Maintain a contiguous range and update its state as boundaries move.',
'Prefix Sum':'Reuse accumulated values to answer or count range queries.',
'Sorting':'Use ordering and partitioning to simplify comparisons and merging.',
'Stack':'Track unresolved or nested state using last-in-first-out processing.',
'Monotonic Stack':'Maintain an ordered set of unresolved candidates and discard dominated values.',
'Binary Search':'Reduce an ordered or monotonic search space while maintaining boundary invariants.',
'Linked List':'Preserve node links while traversing, merging or rearranging a list.',
'Trees':'Combine subtree results or traverse levels while maintaining tree invariants.',
'Tries':'Share prefixes to support efficient string lookup and pruning.',
'Heap / Priority Queue':'Maintain access to the next best candidate without sorting all remaining values.',
'Backtracking':'Explore choices and undo state while pruning invalid branches.',
'Graphs':'Traverse connected state spaces and track visited nodes or distances.',
'Topological Sorting':'Resolve prerequisite order and detect directed cycles.',
'Union Find':'Maintain connected components using representative sets.',
'Advanced Graphs':'Use weighted paths, spanning structures and graph invariants.',
'1-D Dynamic Programming':'Define reusable states over prefixes or positions and derive transitions.',
'2-D Dynamic Programming':'Relate paired indices or grid states through reusable transitions.',
'Greedy':'Choose a locally justified step and establish why it preserves a valid optimum.',
'Intervals':'Order and compare endpoints to merge, schedule or answer coverage queries.',
'Math & Geometry':'Use numerical invariants or coordinate structure to reduce simulation.',
'Bit Manipulation':'Use binary representation and bit operations to isolate or combine information.'}
reclass={207:'Topological Sorting',210:'Topological Sorting',269:'Topological Sorting',261:'Union Find',323:'Union Find',684:'Union Find',739:'Monotonic Stack',84:'Monotonic Stack'}
base=[p for p in data if p.get('neetcode150')];assert len(base)==150
byid={int(p['code'].split('-')[0]):p for p in data}
assert not set(extras)&{int(p['code'].split('-')[0]) for p in base}
for n in extras:assert n in byid,n
premium={271,323,261,269,252,253}
def record(p,curated):
 n=int(p['code'].split('-')[0]);pattern=extras[n][0] if curated and n in extras else reclass.get(n,p['pattern']) if curated else p['pattern']
 link=p['link'];assert re.fullmatch(r'[a-z0-9-]+/',link),link
 video=p.get('video');assert not video or re.fullmatch(r'[\w-]{11}',video),video
 return {'id':p['code'],'title':p['problem'],'problemId':n,'pattern':pattern,'topic':p['pattern'],'difficulty':p['difficulty'].lower(), 'url':'https://leetcode.com/problems/'+link,'concept':extras[n][1] if curated and n in extras else patterns[p['pattern']], 'video':{'url':'https://www.youtube.com/watch?v='+video,'educator':live.get('https://www.youtube.com/watch?v='+video,{}).get('author','NeetCode'),'verification':'publisher-source-mapped'} if video else None, 'externalAccess':'may-require-LeetCode-Premium' if n in premium else 'not-independently-checked','source':source_url,'verification':{'mapping':'publisher-source-mapped','problemHTTP':live.get('https://leetcode.com/problems/'+link,'unchecked'),'videoHTTP':live.get('https://www.youtube.com/watch?v='+video,'unchecked') if video else 'missing'},'selectionRationale':('Adds a prerequisite or additional technique: '+extras[n][1]) if curated and n in extras else 'Broad pattern coverage from the publisher’s interview-focused NeetCode 150 selection.'}
def write(key,title,rows,curated):
 records=[record(p,curated) for p in rows]
 if curated:
  order=list(patterns);records.sort(key=lambda p:(order.index(p['pattern']),{'easy':0,'medium':1,'hard':2}[p['difficulty']],next(i for i,x in enumerate(data) if x['code']==p['id'])))
 for i,p in enumerate(records):p['order']=i+1
 assert len({p['url'] for p in records})==len(records)
 out={'version':1,'key':key,'title':title,'tier':'free','sourceCommit':commit,'source':source_url,'licence':'MIT; see content/sources/neetcode/LICENSE','validationStatus':'source-mappings-validated; live-checks-pending','problems':records}
 Path('content/collections/'+key+'.json').write_text(json.dumps(out,indent=2)+'\n')
 return records
nc=write('dsa-neetcode150','NeetCode 150',base,False)
master=write('dsa-200','200 Most Important Problems',base+[byid[n] for n in extras],True)
report={k:{'records':len(v),'patterns':dict(collections.Counter(p['pattern'] for p in v)),'difficulty':dict(collections.Counter(p['difficulty'] for p in v)),'missingVideos':[p['id'] for p in v if not p['video']],'duplicateURLs':0} for k,v in [('master200',master),('neetcode150',nc)]}
Path('verification/dsa-source-coverage.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
