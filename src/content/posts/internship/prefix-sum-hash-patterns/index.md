---
title: 前缀和配哈希表：计数与最长长度为何写法不同
description: 通过“和为 k 的子数组”理解前缀和、初始状态，以及频次表与最早下标表的区别。
section: internship
date: 2026-08-02
tags: [算法, 前缀和, 哈希表]
---

# Leetcode560 子数组


leetcode560 这个题我首先问第一个事，什么是子数组？[1, 1, 1] 这个数组的子数组到底是啥？它有几个子数组啊？先把这个问题给我解答一下。


子数组（subarray）必须是**连续**的一段元素，这是它和子序列（subsequence，可以不连续）最大的区别。
对
     [1, 1, 1]
 （下标 0,1,2），所有子数组：
长度1：
     [1]
 (下标0)、
     [1]
 (下标1)、
     [1]
 (下标2) —— 3个 长度2：
     [1,1]
 (0-1)、
     [1,1]
 (1-2) —— 2个 长度3：
     [1,1,1]
 (0-2) —— 1个
共 6 个子数组（注意：虽然值都是1，但下标位置不同，算作不同的子数组，这也是这道题统计"和为K的子数组个数"时容易搞错的地方）。
一般地，长度为 n 的数组有 n(n+1)/2 个子数组（本题里就是 3×4/2=6）。



```
class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        //首先的想法是遍历
        //然后以当前的开始，遍历当前下标的全部子串
        //这种的好处是能保证只便利一次，而且不会重复便利
        int n=nums.size();

        int count=0;
        for(int i=0;i<n;i++){
          int sum=0;
          for(int j=i;j<n;j++){
            sum+=nums[j];
            if(sum==k ) {

              count++;

            }
          }
        }
        return count;
    }
};

```



感觉这个题实际上有弄巧成拙的情况，这就是O（n^2)的情况，

这种题还可以结合前缀和+哈希表的方式，用空间换时间压缩到O(n)


```
class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        //还可以用前缀和+哈希表做
        //我来详细解释一下这个哈希表，key是子数组的和，value是频次
        unordered_map<int,int> mp;
        mp[0]=1;
        int count=0;
        int sum=0;
        for(int i=0;i<nums.size();i++){
          sum+=nums[i];
          //如果前面出现的前缀和存在的话
          if(mp.count(sum-k)) {
            count+=mp[sum-k];
          }
          mp[sum]++;
        }
        return count;
    }

};

```



看这种解法，这个哈希表的key是子数组的和，value是频次，这个特别注意count的语法，mp.count(sum-k)的意思是在mp这个哈希表里面，value=sum-k的频次是多少

为啥用sum-k,原因是前缀和的设计
sum[I]=sum[i-1]+num[i]

sum[i-1]=sum[i]-num[i]

我现在算到sum[I]了，要看sum[I]-k的这个东西曾经出现过没，如果没出现过，说明还不行，如果出现了，说明现在加过了，把之前加的频次统计一下就行；还需要注意要初始化mp[0]=1

因为这样对上以后可以才能统计第一次，不然0这个位置都没初始化，会找不到


```
class Solution {
public:
    int findMaxLength(vector<int>& nums) {
        //0的数量和1的数量要一样
        //我觉得这个哈希表得这么开：0的数量统计一下，1的数量统计一下
        //我个人感觉这个是哈希表+前缀和
        //这个题的思路挺神奇的，就是0看成-1；1看成1，那么看0和1的情况，那就是和等于0的
        //那么由此我觉得这个是不是要先对数组进行预处理
        vector<int>q;
        for(auto a:nums) {
          if(a==0) q.push_back(-1);
          else q.push_back(1);
        }

        unordered_map<int,int> mp;
        mp[0]=-1;
        int count=0;
        int sum=0;
        for(int i=0;i<q.size();i++){

          sum+=q[i];
          if(mp.count(sum)) {
            count=max(count,i-mp[sum]);
          }
          else{
            mp[sum]=i;
          }

        }
        return count;
    }
};

```

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
