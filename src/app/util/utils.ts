  /*
  * Utils file holding the utility functions
  */


/*
* Function accepts a string of words and capitalize first letter of every word
* @param str: string type. The stiring that need to capitalize first letter of every word
* @return: word capitalized string 
*/
export function capitalizeWord(str:string): string{
  str = str.split(' ').map(word => word[0].toUpperCase() + word.substring(1)).join(' ');
  return str;
}