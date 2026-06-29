---
title: Hot234 回文链表：从数组到快慢指针的思路演进
description: 先用数组暴力解，再用快慢指针把空间复杂度从 O(n) 降到 O(1)，记录两种思路的 Debug 过程
section: internship
date: 2026-06-29
tags: [LeetCode, 链表, 双指针, C++]
cover: ./cover.jpg
---

## 理解题意

回文链表的意思就是：正着读和倒着读是一样的。比如 `1→2→2→1` 是回文，`1→2→3→2→1` 也是，`1→2→3→4` 不是。

## 思路一：数组暴力（O(n) 时间，O(n) 空间）

最直接的想法——把链表全存进数组，再判断数组是不是回文。

数组判断回文有两种方式：

**方式 A**：对半分，翻转前半段，跟后半段逐一比对。

**方式 B**（我用的）：直接双指针，`i` 从 0 走到 `len/2`，每次判断 `q[i] == q[len-1-i]`，有一个不等就 `return false`。

```cpp
class Solution {
public:
    bool isPalindrome(ListNode* head) {
        ListNode* node = head;
        vector<int> q;
        while (node != nullptr) {
            q.push_back(node->val);
            node = node->next;
        }
        int len = q.size();
        for (int i = 0; i < len / 2; i++) {
            if (q[i] != q[len - 1 - i]) return false;
        }
        return true;
    }
};
```

能过，但空间是 O(n)，题目进阶要求 O(1)。

## 思路二：快慢指针（O(n) 时间，O(1) 空间）

不开数组，直接在链表上操作，三步走：

1. **快慢指针找中点**：fast 每次走两步，slow 每次走一步，fast 到头时 slow 恰好在中点
2. **反转后半段**
3. **前后两半逐一比对**

边界情况想清楚：
- 奇数 `1→2→3→2→1`：fast 走到末尾 `1` 时，slow 在 `3`。反转后半 `3→2→1`，前半从 head 开始是 `1→2→3`，比 `1→2→3` 和 `1→2→3`，都匹配（slow/head2 会先走完较短的那半，循环自然结束）。
- 偶数 `1→2→2→1`：slow 停在第二个 `2`，反转后半 `2→1`，前半 `1→2`，比对通过。

```cpp
class Solution {
public:
    bool isPalindrome(ListNode* head) {
        ListNode* fast = head;
        ListNode* slow = head;
        // 找中点
        while (fast != nullptr && fast->next != nullptr) {
            fast = fast->next->next;
            slow = slow->next;
        }
        // 反转后半段
        ListNode* prev = nullptr;
        while (slow != nullptr) {
            auto temp = slow->next;
            slow->next = prev;
            prev = slow;
            slow = temp;
        }
        // 前后比对
        auto head1 = head;
        auto head2 = prev;
        while (head1 != nullptr && head2 != nullptr) {
            if (head1->val != head2->val) return false;
            head1 = head1->next;
            head2 = head2->next;
        }
        return true;
    }
};
```

两种解法的对比：

| | 时间复杂度 | 空间复杂度 |
|---|---|---|
| 数组法 | O(n) | O(n) |
| 快慢指针 | O(n) | O(1) |
