---
title: "Leetcode325 和等于k的最长子数组"
description: "原始备忘录《Leetcode325 和等于k的最长子数组》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 前缀和, 哈希表]
---

# Leetcode325 和等于k的最长子数组



```
class Solution {
public:
    int maxSubArrayLen(vector<int>& nums, int k) {
        //还是哈希表+前缀和
        unordered_map<long long,int> mp;
        mp[0]=0;
        int n=nums.size();
        long long sum=0;
        int count=0;
        for(int i=0;i<n;i++){
          sum+=nums[i];
          if(mp.count(sum-k)) {
            count=max(count,i+1-mp[sum-k]);
          }
          if(!mp.count(sum)) {
            mp[sum]=i+1;
          }
        }
        return count;
    }
};

```



我自己觉得这个题就是560的子妹版，就是把sum-0改成sum-k,这个样例很大，需要用long long,然后这种哈希表+前缀和的题我也做了几道了，我觉得这种题就是那种，如果问你最大长度，你的哈希表就key=sum;value=长度，哈希表初始化mp[0]=0,mp[0]=-1

如果问你最大频次，那就key=sum,value=频次，初始化哈希表也有区别，这种初始化就mp[0]=1,因为第一次遇到也是1
