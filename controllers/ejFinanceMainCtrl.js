var app = angular.module("ejFinance", []);

app.directive('customOnChange', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeFunc = scope.$eval(attrs.customOnChange);
            element.bind('change', onChangeFunc);
        }
    };
});

app.directive('selectOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {
            var focusedElement;
            element.on('click', function () {
                if (focusedElement != this) {
                    this.select();
                    focusedElement = this;
                }
            });
            element.on('blur', function () {
                focusedElement = null;
            });
        }
    };
})


app.controller("ejFinanceMainCtrl", function ($scope,$http) {
    $scope.mynewVariable="shopping-cart";
    $scope.categoryInfoArray={};
	$scope.transactions = [];
	$scope.category=""
	$scope.description=""
	$scope.date=""
	$scope.amount=""
	$scope.selectedExpenseDetails=[]
	$scope.selectedcategory=""
	const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
	$scope.showPasswordPromptModal=function(category){
		
		$('#passwordPromptModal').modal('show');
		//getExpenseCategories()
	};
	
	$scope.decryptURLsAndGetData=function(){
		
		$scope.apiKey=$scope.decrypt("df96ca9134e1840cbf4bb886f293fa76b4bebc5ae853e5d21c0453c58c8d5cd7U2FsdGVkX19DOJNrXDRc2OJXGCyN/z9T5wKKindJpxIER576Xj7LXibiOC5pntS7EtibcO1fgwYviNWy2pXR6g==",$scope.passphrase)		
		
		$scope.addExpenseUrl=$scope.decrypt("71dd4bd27f9cd5c407a064c293da676ef64edc606910c76919ef5119befd7697U2FsdGVkX19asnMDs05uWcybZ+mLj+i6P/acw7DmWoXCXkDm958bsasUTBZkTMvNfyVFxSaBaITpMC2/nHWeKQlHgkobBOVPsYzhK7JIr8+O6D3SyElMtGP9kzT03TTy",$scope.passphrase)
		
		$scope.getCategoriesReqUrl=$scope.decrypt("60efd11bc70e9e37b472c3a1ed22fcc4276ca955189ebc4229cc0430d6e371ddU2FsdGVkX1+SzekSTphlvOxTOsovuTTOvrGdMMI+SSlqYqPK0w4VgjjOdPY4/Qu+aSAtMhi94Tvjod8Ol2r6wO5pIu+lZGRO9dfkjgJyLCWJlJStej7DpZE64rDFXhTT",$scope.passphrase)
		
		$scope.getExpensesForMonthUrl=$scope.decrypt("aa6c2a5f53cf81804ecfb17f87c4bd1573513d403074ff38958a08b2ab9d3451U2FsdGVkX1/UUYXpsWGbwGp+tOteBSxxRE/y05mBMwavZEQw5iZOlY1s7yPOsCIouBQESTbhKepulLbkhhTxonJqhahdGgLmsV0apPoHoJDc0R9V07a2PmMJ30dJiXhbJBhcPAvPGN/V672ZOs4NNw==",$scope.passphrase)
		$scope.getExpenseCategories()
	}
	
    $scope.showFileSelectionModal=function(category){
		$scope.selectedcategory=category;
		$scope.selectedExpenseDetails=$scope.categoryInfoArray[category].txnsForTheMonth
		$('#exampleModal').modal('show');
	};
	
	
	$scope.decrypt=function(encryptedMsg,passphrase){
		var encryptedHMAC = encryptedMsg.substring(0, 64);
        var encryptedData = encryptedMsg.substring(64);
        var decryptedHMAC = CryptoJS.HmacSHA256(encryptedData, CryptoJS.SHA256(passphrase).toString()).toString();

        if (decryptedHMAC !== encryptedHMAC) {
            alert('Bad passphrase!');            
        }

        var decryptedString = CryptoJS.AES.decrypt(encryptedData, passphrase).toString(CryptoJS.enc.Utf8);
		return decryptedString
		
	}
	
	$scope.addExpense=function(){
		var reqObj={};
		var dateNow=new Date();
		var inputdate=$scope.date;
		reqObj.expensedate=inputdate.getDate()+"-"+(inputdate.getMonth()+1)+"-"+inputdate.getFullYear()+"-"+dateNow.getHours()+dateNow.getMinutes()+dateNow.getSeconds();
		reqObj.expenseDesc=$scope.description;
		reqObj.expensemonth=(inputdate.getMonth()+1)+"-"+inputdate.getFullYear();
		reqObj.category=$scope.selectedcategory;
		reqObj.amount=parseInt($scope.amount);
		
		var addExpenseReq = {
			method: 'POST',
			url: $scope.addExpenseUrl,
			headers: {
				'x-api-key': $scope.apiKey
			},
			data:reqObj
		}
		$http(addExpenseReq)
			.then(function(response) {
				$scope.description="";
				$scope.amount=0;
				if($scope.categoryInfoArray[$scope.selectedcategory].txnsForTheMonth==undefined){
					$scope.categoryInfoArray[$scope.selectedcategory].txnsForTheMonth=[];
				}
				
				var expense={};
				expense.month=addExpenseReq.data.expensemonth;
				expense.expensedate=addExpenseReq.data.expensedate;
				expense.name=addExpenseReq.data.expenseDesc;					
				expense.category=addExpenseReq.data.category;
				expense.amount=addExpenseReq.data.amount;
				if(expense.month==$scope.dataDrivingMonth){
					$scope.updateExpenseData(expense);
				}
			}
			,function(json) {
			    alert("Error in saving expeense "+JSON.stringify(response));
			});
	};
	
	$scope.populateDateData=function(){
		$scope.dataDrivingMonth=((new Date()).getMonth()+1)+"-"+(new Date()).getFullYear();	
		$scope.thisMonth=monthNames[(new Date()).getMonth()]+" "+(new Date()).getFullYear();	
		$scope.today=(new Date()).getDate()+" "+monthNames[(new Date()).getMonth()];
		var daysInThisMonth=new Date((new Date()).getFullYear(), (new Date()).getMonth()+1, 0).getDate();
		$scope.todayRatioInMonth=((new Date()).getDate()/daysInThisMonth)*100;		
	}
	$scope.getExpenseCategories=function(){
		
		var getCategoriesReq = {
			method: 'GET',
			url: $scope.getCategoriesReqUrl,
			headers: {
				'x-api-key': $scope.apiKey
			}
		}
		$http(getCategoriesReq)
			.then(function(response) {
				var maxTotalPerMonth=0;
				for(var categoryIndex=0;categoryIndex<response.data.Items.length;categoryIndex++){
					var categoryResp= response.data.Items[categoryIndex]
					var categoryInfo={};
					var category={};
					category.iconName=categoryResp.iconName.S;
					category.name=categoryResp.name.S;
					category.spendLimit=parseFloat(categoryResp.limit.N);
					category.color=categoryIndex%2 ? "green" : "light-green"
					category.totalExpenseForMonth=0;
					category.spendPercent=0;
					$scope.categoryInfoArray[category.name]=category;
					
					maxTotalPerMonth=maxTotalPerMonth+category.spendLimit;
				}
				$scope.getAllExpenses();
				$scope.maxTotalPerMonth=maxTotalPerMonth;
		    },function(json) {
			    alert("Error in retrieving categories");
			});
	};
	$scope.getAllExpenses=function(){
		
		var date = new Date();
		var month=(date.getMonth()+1)+"-"+date.getFullYear();
		var Url=$scope.getExpensesForMonthUrl+month
		var getExpenseReq = {
			method: 'GET',
			url: Url,
			
		}
		$http(getExpenseReq)
			.then(function(response) {
							
				for(var expenseIndex=0;expenseIndex<response.data.Items.length;expenseIndex++){
					var expenseResp= response.data.Items[expenseIndex]
					
					var expense={};
					expense.month=expenseResp.expensemonth.S;
					expense.expensedate=expenseResp.expensedate.S;
					expense.name=expenseResp.description.S;					
					expense.category=expenseResp.category.S;
					expense.amount=parseFloat(expenseResp.Amount.N);					
					
					$scope.updateExpenseData(expense);
				}
		    },function(json) {
			    alert("Error in finding expenses");
			});
	};
	$scope.updateExpenseData=function(expense){
		var totalExpenseForMonth=$scope.totalExpenseForMonth;
		if(totalExpenseForMonth==undefined){
			totalExpenseForMonth=0;
		}
		$scope.transactions.push(expense);
		totalExpenseForMonth=totalExpenseForMonth+expense.amount;
		var categoryForThisExpense=$scope.categoryInfoArray[expense.category]
		if(categoryForThisExpense.txnsForTheMonth==undefined){
			categoryForThisExpense.txnsForTheMonth=[];
			categoryForThisExpense.totalExpenseForMonth=0;
		}
		categoryForThisExpense.txnsForTheMonth.push(expense)
		categoryForThisExpense.totalExpenseForMonth=categoryForThisExpense.totalExpenseForMonth+expense.amount;
		var spendPercent=categoryForThisExpense.totalExpenseForMonth/categoryForThisExpense.spendLimit;
		spendPercent=spendPercent*100;
		categoryForThisExpense.spendPercent=spendPercent;
		$scope.categoryInfoArray[expense.category]=categoryForThisExpense;
		$scope.totalExpenseForMonth=totalExpenseForMonth;
		$scope.totalSpendPercent=(totalExpenseForMonth/$scope.maxTotalPerMonth)*100
	};
	
});