// team.js



const membersContainer =

document.getElementById(

"membersContainer"

);







// =========================
// INSTRUCTOR
// =========================



const instructorName =

document.getElementById(

"instructorName"

);



instructorName.textContent =

"Name Here";









// =========================
// MEMBERS DATA
// =========================
//
// Replace ages/names later
// Photos automatically load
// from assets/team/
//



const members = [


{
name:"Member 1",
age:11
},


{
name:"Member 2",
age:11
},


{
name:"Member 3",
age:12
},


{
name:"Member 4",
age:12
},


{
name:"Member 5",
age:12
},


{
name:"Member 6",
age:13
},


{
name:"Member 7",
age:13
},


{
name:"Member 8",
age:13
},


{
name:"Member 9",
age:14
},


{
name:"Member 10",
age:14
},


{
name:"Member 11",
age:14
},


{
name:"Member 12",
age:15
},


{
name:"Member 13",
age:15
},


{
name:"Member 14",
age:15
},


{
name:"Member 15",
age:15
},


{
name:"Member 16",
age:14
},


{
name:"Member 17",
age:13
},


{
name:"Member 18",
age:12
},


{
name:"Member 19",
age:11
},


{
name:"Member 20",
age:11
},


{
name:"Member 21",
age:15
}


];









// =========================
// CREATE MEMBER CARDS
// =========================



members.forEach(

(member,index)=>{



const card =

document.createElement(

"div"

);



card.className =

"member-card";







card.innerHTML =

`

<img

src="assets/team/member${index+1}.png"

alt="${member.name}"

>



<h3>

${member.name}

</h3>



<p>

Age: ${member.age}

</p>

`;







membersContainer.appendChild(

card

);



});
